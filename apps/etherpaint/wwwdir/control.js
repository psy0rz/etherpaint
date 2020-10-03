'use strict';

//basic control stuff for the GUI

var control = {};

control.Modes =
    {
        Point: 1,
        Draw: 2,
        Delete: 3,
        Select: 4
    };

control.mode = control.Modes.Point;
control.send_draw_type = event.DrawType.PolyLine;
control.send_draw_color = event.DrawType.PolyLine;

control.last_x = 0;
control.last_y = 0;

//selected tools and colors for draw mode
control.selected = {};


//called when page is ready
control.start = function () {

    //calculate default zoom for this screen
    const zoom_width = 1920;
    // control.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;
    control.zoom_percentage = 100;
    paper.setZoom(control.zoom_percentage / 100, 0, 0);

    //pinch zoom/pan
    control.hammer = new Hammer(document.querySelector("#viewer"), {});
    control.hammer.get('pinch').set({enable: true});
    control.hammer.on('pinch', control.onPinch);
    control.hammer.on('pinchstart', control.onPinchStart);
    control.hammer.on('pinchend', control.onPinchEnd);

    //regular pointer stuff
    document.querySelector("#viewer").addEventListener('pointermove', control.onPointerMove, {passive: false});
    document.querySelector("#viewer").addEventListener('pointerdown', control.onPointerDown, {passive: false});
    document.querySelector("#viewer").addEventListener('pointerup', control.onPointerUp, {passive: true});
    document.querySelector("#viewer").addEventListener('pointercancel', control.onPointerCancel, {passive: true});

    //we DONT want pointer captures (happens on mobile)
    document.querySelector("#viewer").addEventListener('gotpointercapture', function (m) {
        m.target.releasePointerCapture(m.pointerId);

    });

}

control.deselectAll = function () {
    for (const e of document.querySelectorAll(".selected")) {
        e.classList.remove("selected");
    }

}

control.select = function (target) {

    if (target.id != 'viewer') {

        //select
        target.classList.add("selected");

    }
}

control.deleteSelected = function () {
    for (const e of document.querySelectorAll(".selected")) {
        e.classList.remove("selected"); //deselect as well (its hidden now)
        paper.sendDeleteElement(e);
    }
}

//pinch pan/zoom stuff
control.onPinchStart = function (ev) {
    control.lastDeltaX = 0;
    control.lastDeltaY = 0;
    control.lastScale = 1;


//    cancel current drawing action
    control.primaryDown=false;

}

control.onPinch = function (ev) {
    control.primaryDown=false;

    // console.log("wtf");
    // console.log(ev.deltaX, ev.deltaY);
    //
    //zoom snap
    let snappedScale;
    if (ev.scale > 0.8 && ev.scale < 1.2)
        snappedScale=1;
    else
        snappedScale=ev.scale;

    control.zoom_percentage = control.zoom_percentage / control.lastScale * snappedScale;
    control.lastScale = snappedScale;
    paper.setZoom(control.zoom_percentage / 100, ev.center.x, ev.center.y);
    paper.offsetPan(-(ev.deltaX - control.lastDeltaX), -(ev.deltaY - control.lastDeltaY));

    control.lastDeltaX = ev.deltaX;
    control.lastDeltaY = ev.deltaY;


}

control.onPinchEnd = function (ev) {

    paper.setPanVelocity(-ev.velocityX, -ev.velocityY);

}


control.onPointerDown = function (m) {
    // m.stopPropagation();
    // m.preventDefault();

    if (!m.isPrimary)
        return;

    // console.log("DOWN", m.pageX, m.pageY);


    //calculate action svg paper location
    const point = paper.viewer_svg.point(m.pageX, m.pageY);
    const x = Math.round(point.x);
    const y = Math.round(point.y);

    if (x<0 || y<0)
        return;

    control.last_x = x;
    control.last_y = y;

    paper.sendCursor(x, y);

    //do we need to send any tool-selects?
    if (control.send_draw_type !== undefined) {
        paper.sendDrawIncrement(event.IncrementalType.SelectDrawType, control.send_draw_type);
        control.send_draw_type = undefined;

    }


    if (m.buttons & 1) {
        control.primaryDown = true;
        switch (control.mode) {
            case control.Modes.Draw:
                paper.sendDrawIncrement(event.IncrementalType.PointerStart, x, y);
                break;
            case control.Modes.Delete:
                control.deleteSelected();
                break;

        }
    }

};


//de-coalesced events
control.onPointerMove_ = function (m) {
    if (!m.isPrimary)
        return;


    // m.stopPropagation();
//  document.querySelector("#tdebug").innerText=m.target.id;


    //calculate actual svg paper location
    const point = paper.viewer_svg.point(m.pageX, m.pageY);
    const x = Math.round(point.x);
    const y = Math.round(point.y);

    if (x<0 || y<0)
        return;

    if (x != control.last_x || y != control.last_y) {

        //update latest cursor location
        paper.sendCursor(x, y);
        switch (control.mode) {
            case control.Modes.Draw:
                if (control.primaryDown)
                    paper.sendDrawIncrement(event.IncrementalType.PointerMove, x, y);
                break;
            case control.Modes.Delete:
                if (m.target.id != 'viewer') {
                    control.deselectAll();
                    control.select(m.target);
                    if (control.primaryDown)
                        control.deleteSelected();
                }
                break;

        }

        control.last_x = x;
        control.last_y = y;
    }
}

control.onPointerMove = function (m) {
    // m.stopPropagation();

    if (!m.isPrimary)
        return;

    if (m.getCoalescedEvents) {
        for (const coalesced of m.getCoalescedEvents()) {
            control.onPointerMove_(coalesced);
        }
    } else {
        control.onPointerMove_(m);
    }


};


control.onPointerUp = function (m) {
    if (!m.isPrimary)
        return;

    // console.log("UP", m.pageX, m.pageY);

    //calculate action svg paper location
    const point = paper.viewer_svg.point(m.pageX, m.pageY);
    const x = Math.round(point.x);
    const y = Math.round(point.y);

    if (x<0 || y<0)
        return;

    control.last_x = x;
    control.last_y = y;

    if (control.primaryDown) {
        if (control.mode == control.Modes.Draw) {

            paper.sendDrawIncrement(event.IncrementalType.PointerEnd, x, y);
            paper.updateViewport();
        }
        control.primaryDown = false;
    }
};

control.onPointerCancel = function (m) {
    if (!m.isPrimary)
        return;

    // console.log("CANCEL", m.pageX, m.pageY);

    //calculate action svg paper location
    const point = paper.viewer_svg.point(m.pageX, m.pageY);

    if (control.mode == control.Modes.Draw) {
        paper.sendDrawIncrement(event.IncrementalType.PointerCancel, point.x, point.y);
    }
};


control.highlightTool = function (activate) {
    // document.querySelectorAll('#tools ons-toolbar-button').forEach(function(e)
    // {
    //     e.setAttribute("modifier", "");
    // })
    //deselct others
    document.querySelectorAll('#tools .button').forEach(function (e) {
        e.classList.remove("is-primary");
    })
    activate.classList.add("is-primary");

}


control.onClickToolPointer = function (e) {
    control.highlightTool(e);
    control.mode = control.Modes.Point;

};


// control.onClickToolSelect = function (e) {
//     control.highlightTool(e);
//     control.mode=control.Modes.Select;
// };


control.onClickToolPolyline = function (e) {
    control.highlightTool(e);
    // control.mode=control.Modes.Draw;
    // control.selected.drawType=event.DrawType.PolyLine;
    // paper.viewer_element.style.touchAction = "manipulation";
    control.mode = control.Modes.Draw;
    control.send_draw_type = event.DrawType.PolyLine;
};

control.onClickToolRect = function (e) {
    control.highlightTool(e);
    // paper.viewer_element.style.touchAction = "manipulation";

    control.mode = control.Modes.Draw;
    control.send_draw_type = event.DrawType.Rectangle;
};

control.onClickToolDelete = function (e) {
    control.highlightTool(e);
    control.mode = control.Modes.Delete;

};


control.onClickZoomOut = function (e) {
    if (control.zoom_percentage<20)
        return;

    control.zoom_percentage = control.zoom_percentage - 10;
    paper.setZoom(control.zoom_percentage / 100,0,0);
};

control.onClickZoomIn = function (e) {
    // paper.paper_svg.rect(10, 10).move(250, 250).stroke('red');
    control.zoom_percentage = control.zoom_percentage + 10;
    paper.setZoom(control.zoom_percentage / 100, 0,0);
};


//todo: show on GUI
m.handlers[event.EventUnion.Error] = (msg, event_index) => {
    const error = msg.events(event_index, new event.Error());
    console.error("Server reports error: " + error.description());
}


control.onClickHistory = function (e) {
    document.querySelector("#history").classList.remove("is-hidden");
    document.querySelector("#history-slider").max = paper.increments.length - 1;
    document.querySelector("#history-slider").value = paper.increments.length - 1;

    paper.paused = true;
};

control.onClickHistoryClose = function (e) {
    document.querySelector("#history").classList.add("is-hidden");
    paper.paused = false;
    paper.target_index = paper.increments.length - 1;
};

control.onInputHistory = function (e) {
    paper.target_index = e.value;
}

