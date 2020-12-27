'use strict';

//Handle panning/zooming on mobile

import Hammer from "./node_modules/@egjs/hammerjs/dist/hammer.esm.js";
import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(containerElement, viewerElement, paperElement, scratchElement, startedCallback) {

        this.containerElement =containerElement;
        this.viewerElement = viewerElement;
        this.paperElement = paperElement;
        this.scratchElement= scratchElement;

        // this.viewerContainer = viewerElement.parentNode;
        this.viewerSvg = SVG(viewerElement);
        this.paperSvg = SVG(paperElement);
        this.scratchSvg = SVG(scratchElement);

        // this.boxSize = 10000;
        // this.viewerSvg.viewbox(0, 0, this.boxSize, this.boxSize);

        this.startedCallback = startedCallback;

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        // this.zoomX = 0;
        // this.zoomY = 0;

        this.zoomFactor = 1;

        this.animating = false;
        this.controlling = false;

        //calculate default zoom for this screen
        // const zoom_width = 1920;
        // this.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;

        //pinch zoom/pan
        this.hammer = new Hammer(this.viewerElement, {});
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
            //     const newFactor = this.zoomFactorPinchStart * scale;
            //     this.setZoom(newFactor);
            // }


            const left= this.scrollLeftPinchStart - ev.deltaX;
            const top= this.scrollTopPinchStart - ev.deltaY;
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

        //zoom stuff
        // this.zoomFactor = this.zoomUpdateFactor;
        // if (this.zoomUpdateFactor !== this.zoomFactor) {
        //
        //
        //     //actually do the zoom
        //     const width = Math.round(this.boxSize * this.zoomFactor);
        //     const height = Math.round(this.boxSize * this.zoomFactor);
        //
        //     // this.viewerElement.style.width = width;
        //     // this.viewerElement.style.height = height;
        //     //use this, for firefox:\
        //
        //
        //
        //
        //
        //     // this.viewerSvg.width(width);
        //     // this.viewerSvg.height(height);
        //
        //
        // }


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
        // this.viewerContainer.scrollTo(Math.round(this.scrollLeft), Math.round(this.scrollTop));
        // //make sure we dont have a too large or small scroll number
        // this.scrollLeft = this.viewerContainer.scrollLeft;
        // this.scrollTop = this.viewerContainer.scrollTop;
        // const size = Math.round(this.boxSize / this.zoomFactor);

        // const size = Math.round(this.viewerElement.parentNode.clientWidth/this.zoomFactor);
        const sizeWidth = Math.round(this.containerElement.clientWidth/this.zoomFactor);
        const sizeHeight = Math.round(this.containerElement.clientHeight/this.zoomFactor);
        // console.log(this.scrollLeft, this.scrollTop, size, size);
        // document.querySelector("#debug").innerText=this.scrollLeft;


        this.viewerSvg.viewbox(this.scrollLeft, this.scrollTop, sizeWidth, sizeHeight);
        // this.paperSvg.viewbox(this.scrollLeft, this.scrollTop, sizeWidth, sizeHeight);
        this.scratchSvg.viewbox(this.scrollLeft, this.scrollTop, sizeWidth, sizeHeight);
        // this.paperSvg.viewbox(0,0, 10000,10000);
        // this.scratchSvg.viewbox(0,0, 10000,10000);


        // this.scratchSvg.viewbox(this.scrollLeft, this.scrollTop, sizeWidth, sizeHeight);

        //still have velocity?
        if (Math.abs(this.velocityX) >= 1 || Math.abs(this.velocityY) >= 1)
            this.requestAnimate();


    }

}
