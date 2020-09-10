'use strict';

//basic control stuff for the GUI

var control = {};

control.Modes =
    {
        Point: 1,
        Draw: 2,
        Remove: 3,
        Select: 4
    };

control.mode = control.Modes.Point;

//selected tools and colors for draw mode
control.selected = {};


//called when page is ready
control.start = function () {

    //calculate default zoom for this screen
    const zoom_width=1920;
    control.zoom_percentage=  document.querySelector('#paper-container').clientWidth/zoom_width*100;
    paper.setZoom(control.zoom_percentage/100);

    // control.svg_element.addEventListener('mousemove', control.onMouseMove);
    document.querySelector("#viewer").addEventListener('pointermove', control.onPointerMove, { passive: true });
    document.querySelector("#viewer").addEventListener('pointerdown', control.onPointerDown, { passive: false });
    document.querySelector("#viewer").addEventListener('pointerup', control.onPointerUp, { passive: true });
    document.querySelector("#viewer").addEventListener('pointercancel', control.onPointerCancel, { passive: true });

}

control.onPointerDown = function (m) {
    //calculate action svg paper location
    const point=paper.viewer_svg.point(m.pageX, m.pageY);

    paper.sendCursor(point.x, point.y);
    if (m.buttons&1)
    {
        paper.sendDrawIncrement(event.IncrementalType.PointerStart, point.x, point.y);
    }

    m.preventDefault();
};

control.onPointerMove = function (m) {

    //calculate action svg paper location
    const point=paper.viewer_svg.point(m.pageX, m.pageY);

    //last cursor location, dont need all the coalesced events.
    paper.sendCursor(point.x, point.y);

    for (const coalesced of m.getCoalescedEvents())
    {
        //button pressed?
        if (m.buttons & 1) {
            let point=paper.viewer_svg.point(coalesced.pageX, coalesced.pageY);
            paper.sendDrawIncrement(event.IncrementalType.PointerMove, point.x, point.y);
        }
    }
};

control.onPointerUp = function (m) {
    //calculate action svg paper location
    const point=paper.viewer_svg.point(m.pageX, m.pageY);

    paper.sendDrawIncrement(event.IncrementalType.PointerEnd, point.x, point.y);
};

control.onPointerCancel = function (m) {
    //calculate action svg paper location
    const point=paper.viewer_svg.point(m.pageX, m.pageY);

    paper.sendDrawIncrement(event.IncrementalType.PointerCancel, point.x, point.y);
};


control.highlightTool = function(activate)
{
    // document.querySelectorAll('#tools ons-toolbar-button').forEach(function(e)
    // {
    //     e.setAttribute("modifier", "");
    // })
    //deselct others
    document.querySelectorAll('#tools .button').forEach(function(e)
    {
        e.classList.remove("is-primary");
    })
    activate.classList.add("is-primary");

}


control.onClickToolPointer = function (e) {
    control.highlightTool(e);
    // control.mode=control.Modes.Point;
    paper.viewer_element.style.touchAction="manipulation";

    paper.sendDrawIncrement(event.IncrementalType.SelectDrawMode, event.DrawMode.Point);

};

// control.onClickToolSelect = function (e) {
//     control.highlightTool(e);
//     control.mode=control.Modes.Select;
// };


control.onClickToolPolyline = function (e) {
    control.highlightTool(e);
    // control.mode=control.Modes.Draw;
    // control.selected.drawType=event.DrawType.PolyLine;
    paper.viewer_element.style.touchAction="manipulation";

    paper.sendDrawIncrement(event.IncrementalType.SelectDrawType, event.DrawType.PolyLine);
    paper.sendDrawIncrement(event.IncrementalType.SelectDrawMode, event.DrawMode.Draw);
};



control.onClickZoomOut = function (e) {
    control.zoom_percentage=control.zoom_percentage-10;
    paper.setZoom(control.zoom_percentage/100);
};

control.onClickZoomIn = function (e) {
    control.zoom_percentage=control.zoom_percentage+10;
    paper.setZoom(control.zoom_percentage/100);
};


//todo: show on GUI
m.handlers[event.EventUnion.Error] = (msg, event_index) => {
    error = msg.events(event_index, new event.Error());
    console.error("Server reports error: " + error.description());
}


