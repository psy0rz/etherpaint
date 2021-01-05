'use strict';

//control actual drawing.


import {event} from "./messages_generated.js";
import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';
import PaperPanZoom from "./paperPanZoom.js";


const Modes =
    {
        Point: 1,
        Draw: 2,
        Delete: 3,
        Select: 4
    };

export default class ControlDrawing {

    constructor(paperSend) {
        this.mode = Modes.Point;
        this.paperSend = paperSend;

        let self = this;

        // this.scratchElement = document.querySelector("#paper-scratch");
        this.containerElement=document.querySelector("#paper-container");
        this.paperElement = document.querySelector("#paper");
        this.paperSvg = SVG(this.paperElement);
        this.scratchElement = document.querySelector("#scratch");



        //regular pointer stuff
        this.primaryDown = false;


        this.selectedColor="c0";
        this.selectedWidth="w1";


        const eventElement=this.scratchElement;//scratch is faster?

        eventElement.addEventListener('pointermove', this.onPointerMove.bind(this), {passive: true});
        eventElement.addEventListener('pointerdown', this.onPointerDown.bind(this), {passive: true});
        eventElement.addEventListener('pointerup', this.onPointerUp.bind(this), {passive: true});
        eventElement.addEventListener('pointercancel', this.onPointerCancel.bind(this), {passive: true});

        //we DONT want pointer captures (happens on mobile)
        eventElement.addEventListener('gotpointercapture', function (m) {
            m.target.releasePointerCapture(m.pointerId);
        });

        //mobile pan/zoom stuff (for desktop the native browser zoom/pan should be ok)
        this.paperPanZoom = new PaperPanZoom(this.containerElement,this.paperElement, this.scratchElement, this.cancel.bind(this));

        this.attributeDropdown=$('.paper-attribute-dropdown').dropdown({

        });


        $('.paper-click.paper-tool.paper-pointer').on('click', function () {
            self.mode = Modes.Point;
        });


        $('.paper-click.paper-tool.paper-polyline').on('click', function () {
            self.mode = Modes.Draw;
            self.paperSend.selectDrawClass(event.ClassType.Polyline);
        });

        $('.paper-click.paper-tool.paper-rect').on('click', function () {
            self.mode = Modes.Draw;
            self.paperSend.selectDrawClass(event.ClassType.Rectangle);
        });

        $('.paper-click.paper-tool.paper-delete').on('click', function () {
            self.mode = Modes.Delete;
        });

        $('.paper-click.paper-undo').on('click', function () {
            self.paperSend.undo();
            self.paperSend.send();
        });

        $('.paper-click.paper-redo').on('click', function () {
            self.paperSend.redo();
            self.paperSend.send();
        });

        $('.paper-click.paper-zoom-in').on('click', function () {
            // self.paperPanZoom.setZoom(self.paperPanZoom.zoomUpdateFactor+0.1, 1000,1000);
        });
        $('.paper-click.paper-zoom-out').on('click', function () {
            // self.paperPanZoom.setZoom(self.paperPanZoom.zoomUpdateFactor-0.1, 1000 , 1000);

        });

        $('.paper-select-color .paper-click').on('click', function () {
            self.selectColor(this.classList[0]);
        });

        $('.paper-select-width .paper-click').on('click', function () {
            self.selectWidth(this.classList[0]);
        });

        $('.paper-select-dashing .paper-click').on('click', function () {
            self.selectDashing(this.classList[0]);
        });

    }

    selectColor(sel)
    {
        $('.paper-attribute-preview').removeClass(this.selectedColor);
        $(".paper-select-color ."+this.selectedColor).removeClass("selected");

        this.selectedColor=sel;

        $('.paper-attribute-preview').addClass(this.selectedColor);
        $(".paper-select-color ."+this.selectedColor).addClass("selected");

        this.paperSend.selectColor(parseInt(sel.substr(1)));


    }

    selectWidth(sel)
    {
        $('.paper-attribute-preview').removeClass(this.selectedWidth);
        $(".paper-select-width ."+this.selectedWidth).removeClass("selected");

        this.selectedWidth=sel;
        $('.paper-attribute-preview').addClass(this.selectedWidth);
        $(".paper-select-width ."+this.selectedWidth).addClass("selected");

        this.paperSend.selectWidth(parseInt(sel.substr(1)));

    }


    selectDashing(sel)
    {
        $('.paper-attribute-preview').removeClass(this.selectedDashing);
        $(".paper-select-dashing ."+this.selectedDashing).removeClass("selected");

        this.selectedDashing=sel;
        $('.paper-attribute-preview').addClass(this.selectedDashing);
        $(".paper-select-dashing ."+this.selectedDashing).addClass("selected");

        this.paperSend.selectDashing(parseInt(sel.substr(1)));

    }

    // deselectAll() {
    //     for (const e of document.querySelectorAll(".selected")) {
    //         e.classList.remove("selected");
    //     }
    // }
    //
    //
    // select(target) {
    //
    //     if (target.id !== 'viewer') {
    //
    //         //select
    //         target.classList.add("selected");
    //     }
    // }
    //
    // deleteSelected() {
    //     for (const e of document.querySelectorAll(".selected")) {
    //         // e.classList.remove("selected"); //deselect as well (its hidden now)
    //         this.paperSend.drawIncrement(event.IncrementalType.Delete, e.id, 0, 0, true);
    //     }
    //     this.paperSend.send();
    // }

    //calculate svg xy point from normal pageXy coords.
    getSvgPoint(x, y) {
        let point = this.paperSvg.point(x, y);
        //max range is 0-65553
        point.x = Math.max(0,Math.min(65535,Math.round(point.x)));
        point.y = Math.max(0,Math.min(65535,Math.round(point.y)));



        return (point);
    }

    //cancel current action, usually because a pinchzoom is started
    cancel() {

        if (this.primaryDown) {
            this.paperSend.drawCancel();
            this.primaryDown = false;
        }
    }

    onPointerDown(m) {
        // m.stopPropagation();
        // m.preventDefault();

        if (!m.isPrimary)
            return;

        // console.log("DOWN", m.pageX, m.pageY);

        //calculate action svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);


        this.paperSend.updateCursor(point.x, point.y);

        if (m.buttons & 1) {
            this.primaryDown = true;
            switch (this.mode) {
                case Modes.Draw:
                    this.paperSend.drawStart(point.x, point.y);
                    break;
                case Modes.Delete:
                    this.deleteSelected();
                    break;

            }
        }

        this.paperSend.send();

    };

    //de-coalesced pointer moves
    onPointerMove_(m) {


        if (!m.isPrimary)
            return;


        // m.stopPropagation();


        //calculate actual svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);


        //update latest cursor location
        this.paperSend.updateCursor(point.x, point.y);
        switch (this.mode) {
            case Modes.Draw:
                if (this.primaryDown) {
                    this.paperSend.drawUpdate(point.x, point.y);
                }

                break;
            case Modes.Delete:
                if (m.target.id !== 'viewer') {
                    this.deselectAll();
                    this.select(m.target);
                    if (this.primaryDown)
                        this.deleteSelected();
                }
                break;

        }
    }

    onPointerMove(m) {
        // m.stopPropagation();
        // console.log(m.target);

        if (m.getCoalescedEvents) {
            for (const coalesced of m.getCoalescedEvents()) {
                this.onPointerMove_(coalesced);
            }
        }
        this.onPointerMove_(m);

        //sending it at this point also makes use of coalescing.
        this.paperSend.send();
    };


    onPointerUp(m) {
        if (!m.isPrimary)
            return;


        if (this.primaryDown) {
            if (this.mode === Modes.Draw) {
                this.paperSend.drawFinish();
                this.paperSend.send();
            }
            this.primaryDown = false;
        }
    };

    onPointerCancel(m) {
        this.cancel();
    };

}

