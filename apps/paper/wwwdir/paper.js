'use strict';

//actual paper handling stuff. sends/receives events and reads/writes to SVG

let paper = {};


paper.start = function (viewer_element, paper_element, scratch_element, container_element) {

    paper.viewer_element = viewer_element;
    paper.paper_element = paper_element;
    paper.scratch_element = scratch_element;
    paper.container_element = container_element;

    paper.viewer_svg = SVG(viewer_element);
    paper.paper_svg = SVG(paper_element);
    paper.scratch_svg = SVG(scratch_element);

    // paper.paper_svg.text("Alleen pencil en history slider werken. ").attr('font-size', '200%');


    paper.clear();
    //paper.setZoom(1);

    //start frame timer
    paper.onAnimationFrame();
    setInterval(paper.updateViewport, 1000);
    paper.setZoom(1);

}

paper.clear = function () {
    paper.paper_svg.clear();
    paper.scratch_svg.clear();
    paper.clients = {};
    paper.increments = [];
    paper.reverse_increments = [];
    paper.increment_index = -1;
    paper.target_index = -1;
    paper.changed_clients = new Set();
    paper.paused = false;
    paper.echo_client = paper.getClient(0);

}

//send join to server
paper.join = function (id) {
    m.add_event(
        event.EventUnion.Join,
        event.Join.createJoin(
            m.builder,
            m.builder.createString(id)
        ));

    m.send();
}


//server tells us we are joined to a new session.
m.handlers[event.EventUnion.Join] = function (msg, event_index) {
    const join = msg.events(event_index, new event.Join());
    console.log("Joined shared session", join.id(), "as client", join.clientId());

    paper.client_id = join.clientId();
    paper.clear();

}

//find or create PaperClient
paper.getClient = function (client_id) {
    let client = paper.clients[client_id];
    if (!client)
        client = paper.clients[client_id] = new PaperClient(client_id);

    return (client);

}

//update cursor info (onFrameTimer will send it when its time)
paper.sendCursor = function (x, y) {

    if (paper.cursor_x !== x || paper.cursor_y !== y) {
        paper.cursor_x = x;
        paper.cursor_y = y;
        paper.cursor_moved = true;


    }
}

paper.sendDrawIncrement = function (type, p1, p2, p3) {

    //local echo (and determining if event has to be stored/undoable)
    const reverse = paper.echo_client.drawIncrement(type, p1, p2, p3);
    if (type === event.IncrementalType.PointerEnd) {
        //delete temporary object
        if (paper.echo_client.current_element) {
            paper.echo_client.current_element.remove();
            paper.echo_client.current_element = undefined;
        }
    }

    m.add_event(
        event.EventUnion.DrawIncrement,
        event.DrawIncrement.createDrawIncrement(
            m.builder,
            paper.client_id,
            type,
            p1,
            p2,
            p3,
            reverse !== undefined
        ));
}


//received an incremental draw
m.handlers[event.EventUnion.DrawIncrement] = function (msg, event_index) {
    const draw_increment_event = msg.events(event_index, new event.DrawIncrement());
    const client_id = draw_increment_event.clientId();

    // const client=paper.getClient(client_id);
    paper.increments.push([
        client_id,
        draw_increment_event.type(),
        draw_increment_event.p1(),
        draw_increment_event.p2(),
        draw_increment_event.p3(),
        draw_increment_event.store()
    ]);

    // console.log("received: client=", client_id, "type=", draw_increment_event.type(), "parameters",  draw_increment_event.p1(),   draw_increment_event.p2(),  draw_increment_event.p3())

    if (!paper.paused)
        paper.target_index = paper.increments.length - 1;

    // client.drawIncrementEvent(draw_increment);
    // paper.changed_clients.add(client);

}

//draw increments until index. also store reverse increments or delete increments if they dont have a reverse.
//increments without a reverse are usually only for visual effect. (e.g. when drawing a rectangle)
//pay attention to performance in this one
paper.drawIncrements = function (index) {
    while (paper.increment_index < index) {

        paper.increment_index++;

        const increment = paper.increments[paper.increment_index];
        const client = paper.getClient(increment[0]);
        let reverse = [increment[0]]; //client_id
        reverse = reverse.concat(client.drawIncrement(increment[1], increment[2], increment[3], increment[4]));

        //we have more items than the reverse array?
        if (paper.increment_index === paper.reverse_increments.length) {
            //should we store it?
            if (increment[5]) //"store"
            {
                paper.reverse_increments.push(reverse);
                // console.log("STORE", increment);
            } else {
                // console.log("SKIP", increment);
                //we dont have a reverse, so remove it from increments
                paper.increments.splice(paper.increment_index, 1);
                paper.increment_index--;
                paper.target_index--;
                index--;
            }
        }

        // console.log("drawn: i=",paper.increment_index, index, increment);

    }

    // console.log("increments", index, paper.increment_index);
}

paper.drawReverseIncrements = function (index) {
    while (paper.increment_index > index) {

        const increment = paper.reverse_increments[paper.increment_index];
        if (!(increment === undefined)) {
            const client = paper.getClient(increment[0]);

            client.drawIncrement(increment[1], increment[2], increment[3], increment[4]);
        }

        paper.increment_index = paper.increment_index - 1;

    }

}


paper.slideTo = function (index) {

    // console.log("SLIDE", paper.increment_index, index);
    if (paper.increment_index > index) {
        paper.drawReverseIncrements(index);
        // console.log("REV");
    } else if (paper.increment_index < index)
        paper.drawIncrements(index);

}


//draw data and send collected data
// paper.cursors = {};
// paper.cursor_events = {};
// paper.cursor_changed_clients = new Set();
paper.onAnimationFrame = function (s) {


    //only if we are connected
    if (!m.ws || m.ws.readyState !== 1) {
        window.requestAnimationFrame(paper.onAnimationFrame);
        return;
    }

    //DRAW stuff

    //let all changed clients do their incremental draw and cursor stuff:
    for (const client of paper.changed_clients) {
        client.animateCursor();
    }
    paper.changed_clients.clear();


    paper.slideTo(paper.target_index);


    //SEND stuff
    //buffer empty enough?
    //todo: some kind of smarter throttling
    if (m.ws && m.ws.bufferedAmount === 0) {
        //anything to send at all?
        if (paper.cursor_moved || !m.is_empty()) {

            if (paper.cursor_moved) {
                //add latest cursor event
                m.add_event(
                    event.EventUnion.Cursor,
                    event.Cursor.createCursor(
                        m.builder,
                        paper.client_id,
                        paper.cursor_x,
                        paper.cursor_y,
                    ))
                paper.cursor_moved = false;
            }


            m.send();
        }
    }


    window.requestAnimationFrame(paper.onAnimationFrame);
    //testing:
    // setTimeout(paper.onAnimationFrame, 1000);
}


//received a cursor event.
//only store/replace it to handle performance issues gracefully. (e.g. skip updates instead of queue them)
m.handlers[event.EventUnion.Cursor] = (msg, event_index) => {
    const cursor_event = msg.events(event_index, new event.Cursor());
    const client_id = cursor_event.clientId();

    // paper.cursor_events[client_id] = cursor_event;
    // paper.cursor_changed_clients.add(client_id);
    const client = paper.getClient(client_id);
    client.cursorEvent(cursor_event);
    paper.changed_clients.add(client);


}


//set viewport to current zoomfactor and bounding box.
paper.updateViewport = function () {
    //we want the bounding box width + 1 x "screen size" around.
    const bbox = paper.paper_svg.bbox();
    const w = Math.round(bbox.x2 + 1 * paper.container_element.offsetWidth);
    const h = Math.round(bbox.y2 + 1 * paper.container_element.offsetHeight);

    paper.viewer_element.style.width = (w * paper.zoom_factor) + "px";
    paper.viewer_element.style.height = (h * paper.zoom_factor) + "px";
    paper.viewer_svg.viewbox(0, 0, w, h);

}


paper.setZoom = function (factor) {

    paper.zoom_factor = factor;
    paper.updateViewport();

}

