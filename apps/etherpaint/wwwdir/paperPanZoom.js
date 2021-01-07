'use strict';

//Handle panning/zooming

import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

export default class PaperPanZoom {

    constructor(containerElement, paperElement, scratchElement) {

        this.containerElement = containerElement;
        this.paperElement = paperElement;

        this.paperSvg = SVG(paperElement);
        this.scratchSvg = SVG(scratchElement);


        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastFrame = null;

        this.zoomFactor = 0.5;

        this.animating = false;


        //force update
        this.requestAnimate();

    }


    //change current pan to x and y
    setPan(x, y) {

        const bb = this.paperElement.getBBox();
        const maxLeft = bb.x + bb.width;
        const maxTop = bb.y + bb.height;


        if (x < 0)
            this.scrollLeft = 0;
        else if (x > maxLeft)
            this.scrollLeft = maxLeft;
        else
            this.scrollLeft = x;


        if (y < 0)
            this.scrollTop = 0;
        else if (y > maxTop)
            this.scrollTop = maxTop;
        else
            this.scrollTop = y;

        this.requestAnimate();
    }


    //in pixel/ms
    setPanVelocity(x, y) {

        //add to previous velocitys if you kekep flinging in that direction..
        if ((x > 0 && this.velocityX > 0) ||
            (x < 0 && this.velocityX < 0))
            this.velocityX = this.velocityX + x;
        else
            this.velocityX = x;

        if ((y > 0 && this.velocityY > 0) ||
            (y < 0 && this.velocityY < 0))
            this.velocityY = this.velocityY + y;
        else
            this.velocityY = y;


        this.requestAnimate();
    }


    setZoom(factor) {

        //limits
        if (factor > 2)
            factor = 2;
        else if (factor < 0.1)
            factor = 0.1;

        if (factor !== this.zoomFactor) {
            this.zoomFactor = factor;
            this.requestAnimate();
        }

        return (factor);
    }

    requestAnimate() {
        if (!this.animating) {
            window.requestAnimationFrame(this.animate.bind(this));
            this.animating = true;
        }
    }

    calcV(Vprev, delta_t) {


        const a = 0.005 / this.zoomFactor;

        const deltaV = a * delta_t;

        //overshoot/finished
        if (deltaV >= Math.abs(Vprev))
            return (0)

        if (Vprev > 0)
            return (Vprev - deltaV)
        else
            return (Vprev + deltaV)
    }


    //animate actual stuff during animation frame
    animate() {
        const now = Date.now();

        //calculate velocity panning (flinging)
        if (this.lastFrame != null) {
            const delta_t = now - this.lastFrame;

            this.setPan(this.scrollLeft + this.velocityX * delta_t,
                this.scrollTop + this.velocityY * delta_t);

            this.velocityX = this.calcV(this.velocityX, delta_t);
            this.velocityY = this.calcV(this.velocityY, delta_t);
        }

        //actual do the zoom/pan
        const sizeWidth = Math.round(this.containerElement.clientWidth / this.zoomFactor);
        const sizeHeight = Math.round(this.containerElement.clientHeight / this.zoomFactor);

        const scrollLeft = Math.round(this.scrollLeft);
        const scrollTop = Math.round(this.scrollTop);
        this.paperSvg.viewbox(scrollLeft, scrollTop, sizeWidth, sizeHeight);
        this.scratchSvg.viewbox(scrollLeft, scrollTop, sizeWidth, sizeHeight);

        //still have velocity or stop animating?
        this.animating = false;
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.lastFrame = now;
            this.requestAnimate();
        } else {
            this.lastFrame = null;
        }
    }

}
