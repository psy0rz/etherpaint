'use strict';

var paper = {};

paper.Modes =
    {
        Point: 1,
        Draw: 2,
        Remove: 3,
    };

paper.mode = paper.Modes.Point;

//selected tools and colors for draw mode
paper.selected = {};

paper.onMouseMove = function (m) {
    // console.log(m);
    // mouseTarget = m.target.id;
    //work around SVG bug http://code.google.com/p/svgweb/issues/detail?id=244
    paper.cursor_x = m.clientX;//- $("#drawing").offset().left;
    paper.cursor_y = m.clientY; //mousePoint.y = m.clientY - $("#drawing").offset().top;
    paper.cursor_moved = true;
    // mouseMove(false);
};


//on connection/reconnections of websockets
paper.start = function () {
    paper.svg_element = document.querySelector('svg');
    paper.svg = SVG(paper.svg_element);

    paper.svg_element.addEventListener('mousemove', paper.onMouseMove);

    //start interval timer
    paper.onFrameTimer();
}

//add latest cursor position and send all collected events in m
paper.onFrameTimer = function () {

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
    setTimeout(paper.onFrameTimer, 1000 / 60); //60 fps
};

paper.onClickToolPointer = function (tool) {
    paper.selected.drawType=event.DrawType.Circle;

};
