'use strict';

//actual paper handling stuff. sends/receives events and reads/writes to SVG

var paper = {};


paper.start = function (svg) {

    paper.svg = SVG(document.querySelector('svg'));

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
m.handlers[event.EventUnion.Join] = function(msg, event_index)  {
    let join = msg.events(event_index, new event.Join());
    console.log("Join shared session", join.id(), "as client", join.clientId());
    paper.client_id = join.clientId();

}


//update cursor info (onFrameTimer will send it when its time)
paper.sendCursor = function (x, y) {
    paper.cursor_x = x;
    paper.cursor_y = y;
    paper.cursor_moved = true;
    console.log(x,y);
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

// paper.createCursor(client_id)
// {
//     paper.svg.
// }


//received a cursor event
m.handlers[event.EventUnion.Cursor] = (msg, event_index) => {
    const cursor = msg.events(event_index, new event.Cursor());
    const client_id = cursor.clientId();

}



