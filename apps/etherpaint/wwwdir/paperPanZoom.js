'use strict';

//Handle panning/zooming on mobile

import Hammer from "./node_modules/@egjs/hammerjs/dist/hammer.esm.js";
import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(containerElement, paperElement, scratchElement, startedCallback) {

        this.containerElement = containerElement;
        this.paperElement = paperElement;
        this.scratchElement = scratchElement;

        this.paperSvg = SVG(paperElement);
        this.scratchSvg = SVG(scratchElement);

        this.startedCallback = startedCallback;

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastFrame = null;

        this.zoomFactor = 0.5;

        this.animating = false;
        this.controlling = false;


        //pinch zoom/pan
        this.hammer = new Hammer(this.paperElement, {});
        this.hammer.get('pinch').set({enable: true});

        //force update
        this.requestAnimate();

        this.hammer.on('pinchstart', (ev) => {

            this.controlling = true;
            this.startedCallback();

            this.zoomFactorPinchStart = this.zoomFactor;
            this.scrollLeftPinchStart = this.scrollLeft;
            this.scrollTopPinchStart = this.scrollTop;

        });


        this.hammer.on('pinch', (ev) => {
            this.controlling = true;

            //scale: the scalefactor of the current pinch action
            //zoom: the total actual zoom of the paper

            //try to determine minimum scale factor..
            //(minimum size of the drawing so that there is no whitespace around it)
            // const minSize = Math.max(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
            // //(minimum paper zoom factor)
            // const minZoom = minSize / this.boxSize;
            // const maxZoom = 4;
            // //(minimum current scale of this pinch action)
            // const minScale = minZoom / this.zoomFactorPinchStart;
            // const maxScale = maxZoom / this.zoomFactorPinchStart;
            //
            // // const scale = Math.min(maxScale, Math.max(minScale, ev.scale));
            // const scale=ev.scale;

            const scale = ev.scale;

            // if (Math.abs(scale - 1) > 0.5) {
            // const newFactor = this.zoomFactorPinchStart * scale;
            // this.setZoom(newFactor);
            const newFactor = this.zoomFactorPinchStart;
            // }


            const left = this.scrollLeftPinchStart - (ev.deltaX - ev.center.x * (scale - 1)) / newFactor;
            const top = this.scrollTopPinchStart - (ev.deltaY - ev.center.y * (scale - 1)) / newFactor;
            // const x = this.scrollLeftPinchStart * scale - ev.deltaX + ev.center.x * (scale - 1);
            // const y = this.scrollTopPinchStart * scale - ev.deltaY + ev.center.y * (scale - 1);

            // const x = this.scrollLeftPinchStart - ev.deltaX*zoom ;
            // const y = this.scrollTopPinchStart - ev.deltaY*zoom;

            this.setPan(left, top);

        });


        this.hammer.on('pinchend', (ev) => {
            this.setPanVelocity(-ev.velocityX, -ev.velocityY);
            this.controlling = false;
        });


    }


    //change current pan by x and y
    setPan(x, y) {

        this.scrollLeft = x;
        this.scrollTop = y;
        this.panning = true;

        // console.log(this.scrollTop, this.scrollLeft);
        // this.velocityX = 0;
        // this.velocityY = 0;

        this.requestAnimate();

    }

    //in pixel/ms
    setPanVelocity(x, y) {

        if ((x>0 && this.velocityX>0) ||
            (x<0 && this.velocityX<0))
            this.velocityX = this.velocityX + x;
        else
            this.velocityX=x;

        if ((y>0 && this.velocityY>0) ||
            (y<0 && this.velocityY<0))
            this.velocityY = this.velocityY + y;
        else
            this.velocityY=y;


        this.panning = true;

        this.requestAnimate();

    }

    //x and y are the center of the zoom
    setZoom(factor) {

        if (factor === this.zoomFactor)
            return;

        this.zoomFactor = factor;

        this.requestAnimate();
    }

    requestAnimate() {
        if (!this.animating) {
            window.requestAnimationFrame(this.animate.bind(this));
            this.animating = true;
        }
    }

    //handle pinch zoom/panning on mobile
    //much more complicated than you would have hoped :)
    animate() {
        this.animating = false;
        const now = Date.now();

        const a = 0.005;


        function calcV(Vprev, delta_t) {
            const deltaV = a * delta_t;

            //overshoot/finished
            if (deltaV >= Math.abs(Vprev))
                return (0)

            if (Vprev > 0)
                return (Vprev - deltaV)
            else
                return (Vprev + deltaV)
        }


        //calculate velocity panning (flinging)
        if (this.lastFrame != null) {
            const delta_t = now - this.lastFrame;

            this.scrollLeft = this.scrollLeft + this.velocityX * delta_t;
            this.scrollTop = this.scrollTop + this.velocityY * delta_t;

            this.velocityX = calcV(this.velocityX, delta_t);
            this.velocityY = calcV(this.velocityY, delta_t);

        }


        //actuall do the zoom/pan
        const sizeWidth = Math.round(this.containerElement.clientWidth / this.zoomFactor);
        const sizeHeight = Math.round(this.containerElement.clientHeight / this.zoomFactor);

        const scrollLeft = Math.round(this.scrollLeft);
        const scrollTop = Math.round(this.scrollTop);
        this.paperSvg.viewbox(scrollLeft, scrollTop, sizeWidth, sizeHeight);
        this.scratchSvg.viewbox(scrollLeft, scrollTop, sizeWidth, sizeHeight);

        //still have velocity?
        if (this.velocityX != 0 || this.velocityY != 0) {
            this.lastFrame = now;
            this.requestAnimate();
        } else {
            this.lastFrame = null;
        }


    }

}
