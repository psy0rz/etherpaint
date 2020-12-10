'use strict';

//Handle panning/zooming on mobile

export default class PaperPanZoom {

    constructor(viewer_element) {

        this.viewer_element = viewer_element;
        this.viewer_container = viewer_element.parentNode;
        this.viewer_svg = SVG(viewer_element);

        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.velocityX = 0;
        this.velocityY = 0;

        this.zoom_factor = 1;
        this.zoom_update_factor = 1;

        this.animating = false;

        //calculate default zoom for this screen
        // const zoom_width = 1920;
        // this.zoom_percentage = document.querySelector('#paper-container').clientWidth / zoom_width * 100;
        this.zoom_percentage = 100;
        this.setZoom(this.zoom_percentage / 100, 0, 0);

        //pinch zoom/pan
        this.hammer = new Hammer(document.querySelector("#viewer"), {});
        this.hammer.get('pinch').set({enable: true});


        this.hammer.on('pinchstart', (ev) => {
            this.lastDeltaX = 0;
            this.lastDeltaY = 0;
            this.lastScale = 1;

            //    cancel current drawing action
            // this.primaryDown = false;
        });


        this.hammer.on('pinch', (ev) => {
            // this.primaryDown = false;

            //zoom snap
            let snappedScale;
            if (ev.scale > 0.8 && ev.scale < 1.2)
                snappedScale = 1;
            else
                snappedScale = ev.scale;

            this.zoom_percentage = this.zoom_percentage / this.lastScale * snappedScale;
            this.lastScale = snappedScale;
            this.setZoom(this.zoom_percentage / 100, ev.center.x, ev.center.y);
            this.offsetPan(-(ev.deltaX - this.lastDeltaX), -(ev.deltaY - this.lastDeltaY));

            this.lastDeltaX = ev.deltaX;
            this.lastDeltaY = ev.deltaY;
        });


        this.hammer.on('pinchend', (ev) => {
            this.setPanVelocity(-ev.velocityX, -ev.velocityY);
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

        const diff = (factor - this.zoom_update_factor);
        if (diff == 0)
            return;

        this.zoom_update_factor = factor;
        this.zoom_x = x;
        this.zoom_y = y;

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
        if (this.zoom_update_factor != this.zoom_factor) {

            // if (!this.panning) {
            //     //get current coords (on desktop)
            // this.scrollLeft = this.viewer_container.scrollLeft;
            // this.scrollTop = this.viewer_container.scrollTop;
            // }

            //calculate curerently unzoomed coordinates of zoom-point
            const origLeft = (this.scrollLeft + this.zoom_x) / this.zoom_factor;
            const origTop = (this.scrollTop + this.zoom_y) / this.zoom_factor;

            //actually do the zoom
            this.zoom_factor = this.zoom_update_factor;
            this.viewer_svg.viewbox(0, 0, Math.round(this.viewer_element.scrollWidth / this.zoom_factor), Math.round(this.viewer_element.scrollWidth / this.zoom_factor));

            //recaclulate new zoomed coordinates of zoom-point
            this.scrollLeft = (origLeft * this.zoom_factor) - this.zoom_x;
            this.scrollTop = (origTop * this.zoom_factor) - this.zoom_y;

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
        this.viewer_container.scrollTo(Math.round(this.scrollLeft), Math.round(this.scrollTop));

        //still have velocity?
        if (Math.abs(this.velocityX) >= 1 || Math.abs(this.velocityY) >= 1)
            this.requestAnimate();


    }

}
