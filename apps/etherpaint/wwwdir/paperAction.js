'use strict';

import {event} from "./messages_generated.js";
import { SVG } from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';


export default class PaperAction
{
    constructor(client, type, p1, p2, p3) {
        this.client=client;
        this.type=type;
        this.p1=p1;
        this.p2=p2;
        this.p3=p3;
    }

    getNextIdStr(svg)
    {
        if (!svg.nextId)
            svg.nextId = 0;
        else
            svg.nextId=svg.nextId+1;

        return(svg.nextId);
    }

    //apply action to svg
    apply(svg)
    {
        switch (this.type) {
            case event.IncrementalType.SelectDrawType:
                this.previous = this.client.drawType;
                this.client.drawType = this.p1;
                break;

            case event.IncrementalType.PointerStart:
                let attrs={
                    'stroke': 'red',
                    'fill': 'none',
                    'stroke-width': 2
                };
                this.previous=this.client.element;

                switch (this.client.drawType) {
                    case event.DrawType.PolyLine:
                        this.client.element = new SVG().polyline(attrs);
                        break;
                    case event.DrawType.Rectangle:
                        this.client.element = new SVG().Rect(attrs);
                        break;
                    default:
                        break;
                }
                this.client.element.move(this.p1, this.p2);
                this.client.element.node.id = this.getNextIdStr(svg);
                svg.add(this.client.element);
                break;

            case event.IncrementalType.PointerMove:
                switch (this.client.drawType) {
                    case event.DrawType.PolyLine:
                        let point = svg.node.createSVGPoint();
                        point.x = this.p1;
                        point.y = this.p2;
                        this.client.element.node.points.appendItem(point);
                        break;
                    case event.DrawType.Rectangle:
                        this.client.element.attr('width', this.p1 - this.client.element.attr().x);
                        this.client.element.attr('height', this.p2 - this.client.element.attr().y);
                        break;
                    default:
                        break;
                }
                break;
            case event.IncrementalType.PointerEnd:
                break;

            case event.IncrementalType.Delete:
                this.previous = SVG(document.querySelector("#" + this.p1));
                this.previous.remove(); //removes it from SVG document, but we keep a reference to it so we can reverse it
                break;

            default:
                break;
         }
    }

    //reverse action on svg
    reverse(svg)
    {

    }

    //get the undo of for action
    getUndo()
    {

    }

}