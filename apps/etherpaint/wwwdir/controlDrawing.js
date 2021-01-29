'use strict';

//control actual drawing.


import {event} from "/messages_generated.js";
import {SVG} from '/node_modules/@svgdotjs/svg.js/dist/svg.esm.js';
import PaperPanZoom from "/paperPanZoom.js";
import ControlTouchPanZoom from "/controlTouchPanZoom.js";


const Modes =
    {
        Point: 1,
        Draw: 2,
        Delete: 3,
        Select: 4
    };

export default class ControlDrawing {

    constructor(paperSend) {
        // this.mode = Modes.Point;
        this.paperSend = paperSend;

        let self = this;

        // this.scratchElement = document.querySelector("#paper-scratch");
        this.containerElement = document.querySelector("#paper-container");
        this.paperElement = document.querySelector("#paper");
        this.paperSvg = SVG(this.paperElement);
        this.scratchElement = document.querySelector("#scratch");

        this.eventElement = this.scratchElement;//scratch is faster?


        //regular pointer stuff
        this.primaryDown = false;


        this.selectedColor = "c0";
        this.selectedWidth = "w1";


        //panzoom stuff
        this.paperPanZoom = new PaperPanZoom(this.containerElement, this.paperElement, this.scratchElement);
        this.controlTouchPanZoom = new ControlTouchPanZoom(this.paperPanZoom, this.scratchElement, this.cancel.bind(this));

        this.disableDrawing();

        ///////////////////////////////////event listeners

        this.eventElement.addEventListener('pointermove', this.onPointerMove.bind(this), {passive: true});
        this.eventElement.addEventListener('pointerdown', this.onPointerDown.bind(this), {passive: true});
        this.eventElement.addEventListener('pointerup', this.onPointerUp.bind(this), {passive: true});
        this.eventElement.addEventListener('pointercancel', this.onPointerCancel.bind(this), {passive: true});

        this.eventElement.addEventListener('wheel', function (m) {
            self.paperPanZoom.relStart(m.offsetX, m.offsetY);
            if (m.shiftKey) {
                self.paperPanZoom.relZoomPan(1, 0, -m.deltaY);
            } else {
                const factor = 1 - m.deltaY / 250;
                self.paperPanZoom.relZoomPan(factor, 0, 0);
            }
            // console.log(m.deltaZ);
        });


        //we DONT want pointer captures (happens on mobile)
        this.eventElement.addEventListener('gotpointercapture', function (m) {
            m.target.releasePointerCapture(m.pointerId);
        });


        document.addEventListener("wsDisconnected", function () {
            $("#disconnected-message").show();
            self.disableDrawing();
        });


        //join on (re)connect
        document.addEventListener("wsConnected", function () {
            $("#disconnected-message").hide();
            self.disableDrawing();
            if (location.pathname == "/paper.html") {
                //legacy mode
                self.paperSend.join(document.location.search);
            } else {
                //new mode
                self.paperSend.join(document.location.pathname.substr(3));
            }
            self.paperSend.send();


        });

        //new stream started and is syncing.
        this.paperElement.addEventListener("streamStart", function () {
            self.disableDrawing();
            $("#loading-message").show();

        });

        //new stream completed
        this.paperElement.addEventListener("streamSynced", function () {
            self.enableDrawing();
            //reselect correct defaults (clientsId are reused, so theres a big chance the currect selection are non-default)
            self.selectColor("c9");
            self.selectWidth("w4");
            self.selectDashing("d1");
            $(".paper-click.paper-polyline").click();
            $("#loading-message").hide();
        });


        this.attributeDropdown = $('.paper-attribute-dropdown').dropdown({});



        $('.paper-click.paper-tool.paper-pointer').on('click', function () {
            self.setMode(Modes.Point);
        });


        $('.paper-click.paper-tool.paper-polyline').on('click', function () {
            self.setMode(Modes.Draw);
            self.paperSend.selectDrawClass(event.ClassType.Polyline);
        });

        $('.paper-click.paper-tool.paper-rect').on('click', function () {
            self.setMode(Modes.Draw);
            self.paperSend.selectDrawClass(event.ClassType.Rectangle);
        });

        $('.paper-click.paper-tool.paper-circle').on('click', function () {
            self.setMode(Modes.Draw);
            self.paperSend.selectDrawClass(event.ClassType.Circle);
        });

        $('.paper-click.paper-tool.paper-delete').on('click', function () {
            self.setMode(Modes.Delete);
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

    setMode(mode)
    {
        this.mode=mode;
        this.setCursor();
    }

    setCursor()
    {
        switch (this.mode) {
            case Modes.Draw:
                this.containerElement.style.cursor="crosshair";
                break;
            case Modes.Delete:
                this.containerElement.style.cursor="";
                break;
            case Modes.Point:
                this.containerElement.style.cursor="grabbing";
                break;

        }

    }



//disable drawing input from user. (readonly, also used during connect/sync)
    disableDrawing() {
        $("#draw-toolbar .button").addClass("disabled");
        this.eventElement.classList.add("draw-disabled");
        // document.body.classList.add("busy");
    }

    enableDrawing() {
        $("#draw-toolbar .button").removeClass("disabled");
        this.eventElement.classList.remove("draw-disabled");
        // document.body.classList.remove("busy");
    }

    selectColor(sel) {
        $('.paper-attribute-preview').removeClass(this.selectedColor);
        $(".paper-select-color ." + this.selectedColor).removeClass("selected");

        this.selectedColor = sel;

        $('.paper-attribute-preview').addClass(this.selectedColor);
        $(".paper-select-color ." + this.selectedColor).addClass("selected");

        this.paperSend.selectColor(parseInt(sel.substr(1)));
        this.paperSend.send();


    }

    selectWidth(sel) {
        $('.paper-attribute-preview').removeClass(this.selectedWidth);
        $(".paper-select-width ." + this.selectedWidth).removeClass("selected");

        this.selectedWidth = sel;
        $('.paper-attribute-preview').addClass(this.selectedWidth);
        $(".paper-select-width ." + this.selectedWidth).addClass("selected");

        this.paperSend.selectWidth(parseInt(sel.substr(1)));
        this.paperSend.send();

    }


    selectDashing(sel) {
        $('.paper-attribute-preview').removeClass(this.selectedDashing);
        $(".paper-select-dashing ." + this.selectedDashing).removeClass("selected");

        this.selectedDashing = sel;
        $('.paper-attribute-preview').addClass(this.selectedDashing);
        $(".paper-select-dashing ." + this.selectedDashing).addClass("selected");

        this.paperSend.selectDashing(parseInt(sel.substr(1)));
        this.paperSend.send();

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
        point.x = Math.max(0, Math.min(65535, Math.round(point.x)));
        point.y = Math.max(0, Math.min(65535, Math.round(point.y)));


        return (point);
    }

    //cancel current action, usually because a pinchzoom is started
    cancel() {

        if (this.primaryDown) {
            this.paperSend.drawCancel();
            this.primaryDown = false;
        }
    }

    panStart(m)
    {
        this.offsetXstart = m.offsetX;
        this.offsetYstart = m.offsetY;
        this.paperPanZoom.relStart(m.offsetX, m.offsetY);

    }

    onPointerDown(m) {

        if (!m.isPrimary)
            return;


        //calculate actual svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);


        this.paperSend.updateCursor(point.x, point.y);

        //main button
        if (m.buttons & 1) {
            this.primaryDown = true;
            switch (this.mode) {
                case Modes.Draw:
                    this.paperSend.drawStart(point.x, point.y);
                    break;
                case Modes.Delete:
                    this.deleteSelected();
                    break;
                case Modes.Point:
                    this.panStart(m);
                    break;

            }
        }
        else {

            //middle mouse
            if (m.buttons & 4)
            {
                this.containerElement.style.cursor="grabbing";
                this.panStart(m);
            }
        }

        this.paperSend.send();

    };

    //de-coalesced pointer moves
    onPointerMove_(m) {


        if (!m.isPrimary)
            return;

        //calculate actual svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);


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

        if (m.getCoalescedEvents) {
            for (const coalesced of m.getCoalescedEvents()) {
                this.onPointerMove_(coalesced);
            }
        }
        this.onPointerMove_(m);


        ///////////////////// the following stuff here only cares about the last coordinates and wants to skip all the coalesced events:

        if (!m.isPrimary)
            return;

        //calculate actual svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);

        //pan (only need the last event, no need to decoales)
        if (
            (m.buttons & 4) || //middle mouse pressed
            (this.mode == Modes.Point && this.primaryDown) //point mode selected
        )
        {
            this.paperPanZoom.relZoomPan(1, m.offsetX - this.offsetXstart, m.offsetY - this.offsetYstart);
        }

        //update latest cursor location
        this.paperSend.updateCursor(point.x, point.y);

        //sending it at this point also makes use of coalescing. (messages will get queued instead of send directly)
        this.paperSend.send();



    };


    onPointerUp(m) {
        if (!m.isPrimary)
            return;


        if (this.primaryDown) {
            if (this.mode === Modes.Draw) {
                this.paperSend.drawFinish(1/this.paperPanZoom.zoomFactor);
                this.paperSend.send();
            }
            this.primaryDown = false;
        }

        this.setCursor();
    };

    onPointerCancel(m) {
        this.cancel();
    };

}

