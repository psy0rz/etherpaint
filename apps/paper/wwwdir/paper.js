'use strict';

var paper = {};

paper.start = function () {
    paper.svg_element = document.querySelector('svg');
    paper.svg = SVG(paper.svg_element);

    //next buffer we're working on to be send in the next timeslot.
    paper.changes_builder = new flatbuffers.Builder(1);
    paper.changes_offsets = [];

    paper.svg_element.addEventListener('mousemove', function (m) {
        // console.log(m);
        // mouseTarget = m.target.id;
        //work around SVG bug http://code.google.com/p/svgweb/issues/detail?id=244
        paper.cursor_x = m.clientX;//- $("#drawing").offset().left;
        paper.cursor_y = m.clientY; //mousePoint.y = m.clientY - $("#drawing").offset().top;
        paper.cursor_moved = true;
        // console.log(m);
        // mouseMove(false);
    });

    //start interval timer
    paper.send();
}

//send collected data as flatbuffer
paper.send = function () {

    //anything to send at all?
    if (paper.cursor_moved || paper.changes_offsets.length>0) {

        // //add cursor
        // event.DrawChange.startDrawChange(paper.changes_builder);
        // event.DrawChange.addCursor(paper.changes_builder, event.DrawPoint.createDrawPoint(paper.changes_builder, paper.cursor_x, paper.cursor_y ));
        // paper.changes_offsets.push(event.DrawChange.endDrawChange(paper.changes_builder));
        //
        // //create client draw message with our changes in it.
        // paper.changes_builder.finish(
        //     event.Message.createMessage(
        //         paper.changes_builder,
        //         event.EventUnion.ClientDraw,
        //         event.ClientDraw.createClientDraw(
        //             paper.changes_builder,
        //             event.ClientDraw.createChangesVector(
        //                 paper.changes_builder,
        //                 paper.changes_offsets
        //             )
        //         )
        //     )
        // );
        //
        // //send and clear
        // m.send(paper.changes_builder);
        // paper.changes_offsets=[];

        m.builder.finish(
            event.Message.createMessage(
                m.builder,
                event.EventUnion.Cursor,
                event.Cursor.createCursor(
                    m.builder,
                    paper.cursor_x,
                    paper.cursor_y,
                ),
            )
        );
        m.send(m.builder);

        paper.cursor_moved = false;
    }
    setTimeout(paper.send, 1000/60);
};
