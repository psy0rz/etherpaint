'use strict';

//control actual drawing.


import {event} from "./messages_generated.js";
import { SVG } from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';


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
        this.viewerElement = document.querySelector("#viewer");
        this.viewerSvg = SVG(this.viewerElement);


        //regular pointer stuff
        this.primaryDown = false;
        this.viewerElement.addEventListener('pointermove', this.onPointerMove.bind(this), {passive: false});
        this.viewerElement.addEventListener('pointerdown', this.onPointerDown.bind(this), {passive: false});
        this.viewerElement.addEventListener('pointerup', this.onPointerUp.bind(this), {passive: true});
        this.viewerElement.addEventListener('pointercancel', this.onPointerCancel.bind(this), {passive: true});

        //we DONT want pointer captures (happens on mobile)
        this.viewerElement.addEventListener('gotpointercapture', function (m) {
            m.target.releasePointerCapture(m.pointerId);
        });

        $('.onClick.tool.pointer').on('click', function () {
            self.highlightTool(this);
            self.mode = Modes.Point;
        });


        $('.onClick.tool.polyline').on('click', function () {
            self.highlightTool(this);
            self.mode = Modes.Draw;
            self.paperSend.selectDrawClass(event.ClassType.Polyline);
        });

        $('.onClick.tool.rect').on('click', function () {
            self.highlightTool(this);
            self.mode = Modes.Draw;
            self.paperSend.selectDrawClass(event.ClassType.Rectangle);
        });

        $('.onClick.tool.delete').on('click', function () {
            self.highlightTool(this);
            self.mode = Modes.Delete;
        });

        $('.onClick.tool.undo').on('click', function () {


        });

    }

    highlightTool(e) {
        //deselect others
        $('.onClick.tool').removeClass('active');
        $(e).addClass('active');
    }

    deselectAll() {
        for (const e of document.querySelectorAll(".selected")) {
            e.classList.remove("selected");
        }
    }


    select(target) {

        if (target.id !== 'viewer') {

            //select
            target.classList.add("selected");
        }
    }

    deleteSelected() {
        for (const e of document.querySelectorAll(".selected")) {
            // e.classList.remove("selected"); //deselect as well (its hidden now)
            this.paperSend.drawIncrement(event.IncrementalType.Delete, e.id,0,0,true);
        }
    }

    //calculate svg xy point from normal pageXy coords.
    getSvgPoint(x, y) {
        let point = this.viewerSvg.point(x, y);
        point.x = Math.round(point.x);
        point.y = Math.round(point.y);
        return (point);
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

    };

    //de-coalesced pointer moves
    onPointerMove_(m) {
        if (!m.isPrimary)
            return;


        // m.stopPropagation();
//  document.querySelector("#tdebug").innerText=m.target.id;


        //calculate actual svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);



        //update latest cursor location
        this.paperSend.updateCursor(point.x, point.y);
        switch (this.mode) {
            case Modes.Draw:
                if (this.primaryDown )
                {
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

        if (m.getCoalescedEvents) {
            for (const coalesced of m.getCoalescedEvents()) {
                this.onPointerMove_(coalesced);
            }
        } else {
            this.onPointerMove_(m);
        }
    };


    onPointerUp(m) {
        if (!m.isPrimary)
            return;


        if (this.primaryDown) {
            if (this.mode === Modes.Draw) {
                this.paperSend.drawFinish();
            }
            this.primaryDown = false;
        }
    };

    onPointerCancel(m) {
        if (!m.isPrimary)
            return;

        console.log("CANCEL", m.pageX, m.pageY);

        //calculate action svg paper location
        const point = this.getSvgPoint(m.pageX, m.pageY);

        // if (this.mode === Modes.Draw) {
        //     this.paperSend.drawIncrement(event.IncrementalType.PointerCancel, point.x, point.y);
        // }
    };

}

