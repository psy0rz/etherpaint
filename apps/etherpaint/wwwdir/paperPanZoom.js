'use strict';

//Handle panning/zooming on mobile

import Hammer from "./node_modules/@egjs/hammerjs/dist/hammer.esm.js";
import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(viewerElement, startedCallback) {

        this.viewerElement = viewerElement;
        this.viewerContainer = viewerElement.parentNode;
        this.viewerSvg = SVG(viewerElement);

        this.boxSize = 10000;
        this.viewerSvg.viewbox(0, 0, this.boxSize, this.boxSize);

        this.startedCallback = startedCallback;

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.zoomX = 0;
        this.zoomY = 0;

        this.zoomFactor = 2;
        this.zoomUpdateFactor = 1;

        this.animating = false;
        this.controlling = false;

        //calculate default zoom for this screen
        // const zoom_width = 1920;
        // this.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;

        //pinch zoom/pan
        this.hammer = new Hammer(this.viewerElement, {});
        this.hammer.get('pinch').set({enable: true});

        this.requestAnimate();


        this.hammer.on('pinchstart', (ev) => {

            this.controlling = true;
            this.startedCallback();

            this.lastDeltaX = 0;
            this.lastDeltaY = 0;
            this.zoomFactorPinchStart = this.zoomUpdateFactor;
            this.scrollLeftPinchStart = this.scrollLeft;
            this.scrollTopPinchStart = this.scrollTop;

        });


        this.hammer.on('pinch', (ev) => {
            this.controlling = true;

            document.getElementById("debug").innerText = ev.center.x;


            this.setZoom(this.zoomFactorPinchStart * ev.scale);



            const x = this.scrollLeftPinchStart * ev.scale - ev.deltaX + ev.center.x*(ev.scale-1);
            const y = this.scrollTopPinchStart * ev.scale - ev.deltaY + ev.center.y * (ev.scale-1);



            this.setPan(x, y);

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
    setZoom(factor) {

        if (factor === this.zoomUpdateFactor)
            return;

        this.zoomUpdateFactor = factor;

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
        if (this.zoomUpdateFactor !== this.zoomFactor) {

            //calculate curerently unzoomed coordinates of zoom-point
            // const origLeft = (this.scrollLeft ) * this.zoomFactor;
            // const origTop = (this.scrollTop ) * this.zoomFactor;

            // const zoomDiff=this.zoomUpdateFactor/this.zoomFactor;
            this.zoomFactor = this.zoomUpdateFactor;

            //actually do the zoom
            const width = Math.round(this.boxSize * this.zoomFactor);
            const height = Math.round(this.boxSize * this.zoomFactor);
            this.viewerElement.style.width = width;
            this.viewerElement.style.height = height;

            //recaclulate new zoomed coordinates of zoom-point of the container
            // this.scrollLeft =  zoomDiff * this.scrollLeft;
            // this.scrollTop =  zoomDiff * this.scrollTop;

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
        //make sure we dont have a too large or small scroll number
        this.scrollLeft=this.viewerContainer.scrollLeft;
        this.scrollTop=this.viewerContainer.scrollTop;

        //still have velocity?
        if (Math.abs(this.velocityX) >= 1 || Math.abs(this.velocityY) >= 1)
            this.requestAnimate();


    }

}
