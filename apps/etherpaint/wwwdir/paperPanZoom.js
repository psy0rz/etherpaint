'use strict';

//Handle panning/zooming on mobile

import Hammer from "./node_modules/@egjs/hammerjs/dist/hammer.esm.js";
import { SVG } from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(viewerElement, startedCallback) {

        this.viewerElement = viewerElement;
        this.viewerContainer = viewerElement.parentNode;
        this.viewerSvg = SVG(viewerElement);

        this.startedCallback=startedCallback;

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;

        this.zoomFactor = 1;
        this.zoomUpdateFactor = 1;

        this.animating = false;
        this.controlling = false;

        //calculate default zoom for this screen
        // const zoom_width = 1920;
        // this.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;
        this.zoomPercentage = 100;
        this.setZoom(this.zoomPercentage / 100, 0, 0);

        //pinch zoom/pan
        this.hammer = new Hammer(this.viewerElement, {});
        this.hammer.get('pinch').set({enable: true});


        this.hammer.on('pinchstart', (ev) => {

            this.controlling=true;
            this.startedCallback();

            this.lastDeltaX = 0;
            this.lastDeltaY = 0;
            this.lastScale = 1;

        });


        this.hammer.on('pinch', (ev) => {
            this.controlling=true;

            //zoom snap
            let snappedScale;
            if (ev.scale > 0.8 && ev.scale < 1.2)
                snappedScale = 1;
            else
                snappedScale = ev.scale;

            this.zoomPercentage = this.zoomPercentage / this.lastScale * snappedScale;
            this.lastScale = snappedScale;
            this.setZoom(this.zoomPercentage / 100, ev.center.x, ev.center.y);
            this.offsetPan(-(ev.deltaX - this.lastDeltaX), -(ev.deltaY - this.lastDeltaY));

            this.lastDeltaX = ev.deltaX;
            this.lastDeltaY = ev.deltaY;
        });


        this.hammer.on('pinchend', (ev) => {
            this.setPanVelocity(-ev.velocityX, -ev.velocityY);
            this.controlling=false;
        });


    }


    //change current pan by x and y
    offsetPan(x, y) {
        if (x == 0 && y == 0)
            return;

        //snap
        // if (this.viewer_element.parentNode.scrollLeft + x < 1)
        //     this.viewer_element.parentNode.scrollLeft = 0;
        // else
        //     this.viewer_element.parentNode.scrollLeft += x;
        //
        //
        // if (this.viewer_element.parentNode.scrollTop + y < 1)
        //     this.viewer_element.parentNode.scrollTop =0;
        // else
        //     this.viewer_element.parentNode.scrollTop += y;


        this.scrollLeft += x;
        this.scrollTop += y;
        this.panning = true;

        // console.log(this.scrollTop, this.scrollLeft);
        this.velocityX = 0;
        this.velocityY = 0;

        this.requestAnimate();

    }

    //in pixel/ms
    setPanVelocity(x, y) {

        this.velocityX = x * 17; //1000ms/60fps
        this.velocityY = y * 17;
        this.panning = true;

        this.requestAnimate();

    }

    //x and y are the center of the zoom
    setZoom(factor, x, y) {

        const diff = (factor - this.zoomUpdateFactor);
        if (diff == 0)
            return;

        this.zoomUpdateFactor = factor;
        this.zoomX = x;
        this.zoomY = y;

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

        //zoom stuff
        if (this.zoomUpdateFactor != this.zoomFactor) {


            //calculate curerently unzoomed coordinates of zoom-point
            const origLeft = (this.scrollLeft + this.zoomX) / this.zoomFactor;
            const origTop = (this.scrollTop + this.zoomY) / this.zoomFactor;

            //actually do the zoom
            this.zoomFactor = this.zoomUpdateFactor;
            this.viewerSvg.viewbox(0, 0, Math.round(this.viewerElement.scrollWidth / this.zoomFactor), Math.round(this.viewerElement.scrollWidth / this.zoomFactor));

            //recaclulate new zoomed coordinates of zoom-point
            this.scrollLeft = (origLeft * this.zoomFactor) - this.zoomX;
            this.scrollTop = (origTop * this.zoomFactor) - this.zoomY;

        }


        //velocity panning (flinging)
        if (this.velocityX > 1) {
            this.scrollLeft += this.velocityX;
            this.velocityX -= 1;
        } else if (this.velocityX < -1) {
            this.scrollLeft += this.velocityX;
            this.velocityX += 1;
        }

        if (this.velocityY > 1) {
            this.scrollTop += this.velocityY;
            this.velocityY -= 1;
        } else if (this.velocityY < -1) {
            this.scrollTop += this.velocityY;
            this.velocityY += 1;
        }

        if (this.scrollLeft < 0) {
            this.scrollLeft = 0;
            this.velocityX = 0;
        }

        if (this.scrollTop < 0) {
            this.scrollTop = 0;
            this.velocityY = 0;
        }

        //actual pan execution
        // console.log("SCROLLTO", this.scrollLeft, this.scrollTop);
        this.viewerContainer.scrollTo(Math.round(this.scrollLeft), Math.round(this.scrollTop));

        //still have velocity?
        if (Math.abs(this.velocityX) >= 1 || Math.abs(this.velocityY) >= 1)
            this.requestAnimate();


    }

}
