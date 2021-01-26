'use strict';

//Handle panning/zooming on mobile
//Much much more complex than you might expect :)

//NOTE: simple one finger panning-mode isnt in here, since that doesnt require gesture detection. (its in controlDrawing.js, mode Point)

import Hammer from "/node_modules/@egjs/hammerjs/dist/hammer.esm.js";

export default class ControlTouchPanZoom {

    constructor(paperPanZoom, element, startedCallback) {


        //pinch zoom/pan
        this.hammer = new Hammer(element, {});
        this.hammer.get('pinch').set({enable: true});

        this.hammer.on('pinchstart', (ev) => {

            // this.controlling = true;
            startedCallback();

            // this.zoomFactorPinchStart = paperPanZoom.zoomFactor;
            // this.scrollLeftPinchStart = paperPanZoom.scrollLeft;
            // this.scrollTopPinchStart = paperPanZoom.scrollTop;
            paperPanZoom.relStart(ev.center.x, ev.center.y);
            // this.xCenterPinchStart = ev.center.x;
            // this.yCenterPinchStart = ev.center.y;

        });


        this.hammer.on('pinch', (ev) => {
            // this.controlling = true;

            let scale;
            //snap/prevent useless zooming because of performance
            const snap=0;
            if (Math.abs(ev.scale - 1) < snap) {
                scale = 1;
            } else {
                scale = ev.scale;
            }

            // const newFactor = paperPanZoom.setZoom(this.zoomFactorPinchStart * scale);
            paperPanZoom.relZoomPan(scale,  ev.deltaX, ev.deltaY);



            // //zoom has limits, so recalc scale
            // scale = newFactor / this.zoomFactorPinchStart;
            //
            // const left = this.scrollLeftPinchStart - (ev.deltaX - this.xCenterPinchStart * (scale - 1)) / newFactor;
            // const top = this.scrollTopPinchStart - (ev.deltaY - this.yCenterPinchStart * (scale - 1)) / newFactor;
            //
            // paperPanZoom.setPan(left, top);

        });


        this.hammer.on('pinchend', (ev) => {
            // paperPanZoom.setPanVelocity(-ev.velocityX / paperPanZoom.zoomFactor, -ev.velocityY / paperPanZoom.zoomFactor);
        });

    }
}
