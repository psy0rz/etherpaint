'use strict';

//communicate with server


import PaperDraw from "./paperDraw.js";

export default class Paper {

    start(viewer_element, paper_element, scratch_element, container_element) {

        paper.viewer_element = viewer_element;
        paper.viewer_container = viewer_element.parentNode;
        paper.paper_element = paper_element;
        paper.scratch_element = scratch_element;
        paper.container_element = container_element;

        paper.viewer_svg = SVG(viewer_element);
        paper.paper_svg = SVG(paper_element);
        paper.scratch_svg = SVG(scratch_element);

        // paper.paper_svg.text("Alleen pencil en history slider werken. ").attr('font-size', '200%');

        paper.paper_draw = new PaperDraw(paper.paper_svg, paper.scratch_svg);


        paper.paper_draw.clear();

        //start frame timer
        paper.onAnimationFrame();
        // setInterval(paper.updateViewport, 1000);

    }

    clear() {
        // paper.increments = [];
        // paper.reverse_increments = [];
        // paper.increment_index = -1;
        // paper.target_index = -1;
        // paper.changed_clients = new Set();
        // paper.paused = false;
        paper.echo_client = paper.paper_draw.getClient(0);



    }

//send join to server
    join(id) {
        m.add_event(
            event.EventUnion.Join,
            event.Join.createJoin(
                m.builder,
                m.builder.createString(id)
            ));

        m.send();
    }


//server tells us we are joined to a new session.
    m
.
    handlers
    [event.EventUnion.Join] = function (msg, event_index) {
        const join = msg.events(event_index, new event.Join());
        console.log("Joined shared session", join.id(), "as client", join.clientId());

        paper.client_id = join.clientId();
        paper.clear();

    }


//update cursor info (onFrameTimer will send it when its time)
    sendCursor(x, y) {

        if (paper.cursor_x !== x || paper.cursor_y !== y) {
            paper.cursor_x = x;
            paper.cursor_y = y;
            paper.cursor_moved = true;
            if (test.recording)
                test.record([x, y]);


        }
    }

//this is main function that is called from control.js to send actual drawing commands.
    sendDrawIncrement(type, p1, p2, p3) {

        // console.log(type, p1, p2, p3);

        //TODO: make sure it happens in animation frame
        //local echo (and determining if event has to be stored/undoable)
        const reverse = paper.echo_client.drawIncrement(type, p1, p2, p3);


        //delete temporary object if there is any
        if (type === event.IncrementalType.PointerEnd) {
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

        if (test.recording)
            test.record([type, p1, p2, p3]);

    }


//received an incremental draw
    m
.
    handlers
    [event.EventUnion.DrawIncrement] = function (msg, event_index) {
        const draw_increment_event = msg.events(event_index, new event.DrawIncrement());

        paper.paper_draw.addIncrement(
            draw_increment_event.clientId(),
            draw_increment_event.type(),
            draw_increment_event.p1(),
            draw_increment_event.p2(),
            draw_increment_event.p3(),
            draw_increment_event.store()
        )


    }


    undo = function () {

    }


//draw data and send collected data
// paper.cursors = {};
// paper.cursor_events = {};
// paper.cursor_changed_clients = new Set();
    onAnimationFrame(s) {


        //only if we are connected
        if (!m.ws || m.ws.readyState !== 1) {
            window.requestAnimationFrame(paper.onAnimationFrame);
            return;
        }

        paper.animatePanZoom();

        paper.paper_draw.draw();


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
    m
.
    handlers
    [event.EventUnion.Cursor] = (msg, event_index) => {
        const cursor_event = msg.events(event_index, new event.Cursor());
        const client_id = cursor_event.clientId();

        paper.paper_draw.updateCursor(client_id, cursor_event);

    }


//set viewport to current zoomfactor and bounding box.
    updateViewport() {

        //we want the bounding box width + 1 x "screen size" around.
        // const bbox = paper.paper_svg.bbox();
        // const w = Math.round(bbox.x2 + 1 * paper.container_element.offsetWidth);
        // const h = Math.round(bbox.y2 + 1 * paper.container_element.offsetHeight);

        // paper.viewer_svg.viewbox(0, 0, Math.round(paper.viewer_element.scrollWidth / paper.zoom_factor), Math.round(paper.viewer_element.scrollWidth / paper.zoom_factor));
        // paper.viewer_element.style.width = Math.round(w * paper.zoom_factor) + "px";
        // paper.viewer_element.style.height = Math.round(h * paper.zoom_factor) + "px";

    }

// paper.offsetZoom=function(offsetFactor)
// {
//     paper.setZoom(paper.zoom_factor+offsetFactor);
// }


//send a "delete" (archive) for specified target element
    paper
.
    sendDeleteElement = function (target) {
        const matches = target.id.match(/c(\d*)o(\d*)/);
        if (matches) {
            const client_id = matches[1];
            const object_id = matches[2];
            paper.sendDrawIncrement(event.IncrementalType.Archive, client_id, object_id);
        }
    }

}