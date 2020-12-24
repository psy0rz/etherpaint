'use strict';

//Handle panning/zooming on mobile

import Hammer from "./node_modules/@egjs/hammerjs/dist/hammer.esm.js";
import { SVG } from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(viewerElement, startedCallback) {

        this.viewerElement = viewerElement;
        this.viewerContainer = viewerElement.parentNode;
        this.viewerSvg = SVG(viewerElement);

        this.boxSize=3000;
        this.viewerSvg.viewbox(0, 0, this.boxSize, this.boxSize);

        this.startedCallback=startedCallback;

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;

        this.zoomFactor = undefined;
        this.zoomUpdateFactor = 1;

        this.animating = false;
        this.controlling = false;

        //calculate default zoom for this screen
        // const zoom_width = 1920;
        // this.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;
        this.zoomPercentage = 100;
//        this.setZoom(this.zoomPercentage / 100, 0, 0);

        //pinch zoom/pan
        this.hammer = new Hammer(this.viewerElement, {});
        this.hammer.get('pinch').set({enable: true});

        this.requestAnimate();


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
            if (this.zoomPercentage<25)
                this.zoomPercentage=25;

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

        if (factor === this.zoomUpdateFactor)
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
        if (this.zoomUpdateFactor !== this.zoomFactor) {

            //calculate curerently unzoomed coordinates of zoom-point
            const origLeft = (this.scrollLeft ) * this.zoomFactor;
            const origTop = (this.scrollTop ) * this.zoomFactor;

            //actually do the zoom
            this.zoomFactor = this.zoomUpdateFactor;

            const width= Math.round(this.boxSize * this.zoomFactor);
            const height= Math.round(this.boxSize * this.zoomFactor);


            // this.viewerSvg.viewbox(0, 0, viewboxWidth, viewboxHeight);
            this.viewerElement.style.width=width;
            this.viewerElement.style.height=height;

            //recaclulate new zoomed coordinates of zoom-point of the container
           this.scrollLeft = Math.round(origLeft / this.zoomFactor);
           this.scrollTop = Math.round(origTop / this.zoomFactor );
  //
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
