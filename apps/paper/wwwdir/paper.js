'use strict';

//actual paper handling stuff. sends/receives events and reads/writes to SVG

var paper = {};


paper.start = function (svg_element, grid_element) {

    paper.svg_element=svg_element;
    paper.grid_element=grid_element;

    paper.svg = SVG(svg_element);
    paper.grid= SVG(grid_element);

    paper.setZoom(1);

    //start timer
    paper.onFrameTimer();

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


//received join from server
m.handlers[event.EventUnion.Join] = function (msg, event_index) {
    let join = msg.events(event_index, new event.Join());
    console.log("Join shared session", join.id(), "as client", join.clientId());
    paper.client_id = join.clientId();

}


//update cursor info (onFrameTimer will send it when its time)
paper.sendCursor = function (x, y) {

    if (paper.cursor_x != x || paper.cursor_y != y) {
        paper.cursor_x = x;
        paper.cursor_y = y;
        paper.cursor_moved = true;

    }
}


//add latest cursor position and send all collected events in messaging
paper.onFrameTimer = function () {
    setTimeout(paper.onFrameTimer, 1000 / 60); //60 fps, unless we're too slow
    //buffer empty enough?
    //todo: some kind of smarter throttling
    if (m.ws && m.ws.bufferedAmount == 0) {
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
}

paper.cursors = {};

//received a cursor event
m.handlers[event.EventUnion.Cursor] = (msg, event_index) => {
    const cursor_event = msg.events(event_index, new event.Cursor());
    const client_id = cursor_event.clientId();


    // paper.svg.path("M0,0 L10,10 M0,0 L0,10").stroke('red');
    // paper.svg.path("M10000,10000 L0,0").stroke('blue');

    //create?
    if (!(client_id in paper.cursors)) {
        paper.cursors[client_id] = paper.svg.group();
        paper.cursors[client_id].path('M-10,0 L10,0 M0,-10 L0,10').stroke('black');
        paper.cursors[client_id].text("client " + client_id);
    }

    // paper.cursors[client_id].move(cursor_event.x(),cursor_event.y());

    // paper.cursors[client_id].cx(cursor_event.x()).cy(cursor_event.y());
    paper.cursors[client_id].transform({
        translateX: cursor_event.x(),
        translateY: cursor_event.y()
    });

    // paper.cursors[client_id].translate(cursor_event.x(),cursor_event.y());
    // console.log(cursor_event.x(), cursor_event.y());
}


paper.setZoom = function (factor) {

    const paper_size = 6500;

    paper.svg_element.style.height = (paper_size * factor) + "px";
    paper.svg_element.style.width = (paper_size * factor) + "px";
    paper.svg.viewbox(0, 0, paper_size , paper_size );

    paper.grid_element.style.height = (paper_size * factor) + "px";
    paper.grid_element.style.width = (paper_size * factor) + "px";
    paper.grid.viewbox(0, 0, paper_size , paper_size );


    // document.querySelector('#grid').

    // paper.grid(factor);
}

