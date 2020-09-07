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

control.onMouseMove = function (m) {
    paper.sendCursor(m.offsetX, m.offsetY);
};


//called when page is ready
control.start = function () {
    control.svg_element = document.querySelector('svg');

    control.svg_element.addEventListener('mousemove', control.onMouseMove);



}


control.deselectTools = function()
{
    document.querySelectorAll('#tools ons-toolbar-button').forEach(function(e)
    {
        e.setAttribute("modifier", "");
    })
}


control.onClickToolPointer = function (e) {
    control.deselectTools();
    control.mode=control.Modes.Point;
    e.setAttribute("modifier", "outline");
};

control.onClickToolSelect = function (e) {
    control.deselectTools();
    control.mode=control.Modes.Select;
    e.setAttribute("modifier", "outline");
};


control.onClickToolPolyline = function (e) {
    control.deselectTools();
    control.selected.drawType=event.DrawType.PolyLine;
    control.mode=control.Modes.Draw;
    e.setAttribute("modifier", "outline");
};

//todo: show on GUI
m.handlers[event.EventUnion.Error] = (msg, event_index) => {
    error = msg.events(event_index, new event.Error());
    console.error("Server reports error: " + error.description());
}
