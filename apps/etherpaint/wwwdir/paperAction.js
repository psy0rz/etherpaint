'use strict';

import {event} from "./messages_generated.js";
import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';

//apparte action voor ieder drawtype maken?
//en ook appart event voor ieder draw type ipv 1 generieke drawincrement?
//maakt de events kleiner, en is sneller aan de javascript kant (geen switch meer!)
//lastig aan de server kant: ieder non-struct ding heeft zn eigen handlers nodig? struct dingen kunnen iig templated

export class PaperActionPolyline {
    constructor(clientId, points, attributes) {
        this.element = new SVG().polyline(points).attr(attributes);
        this.element.node.id = clientId;
        this.updatePoints=[];
    }

    addPoint(svgPoint) {
        this.updatePoints.push(svgPoint);
    }

    draw(svg) {
        svg.add(this.element);
    }

    drawUpdate()
    {
        for (const svgPoint of this.updatePoints) {
            this.element.node.points.appendItem(svgPoint);
        }
        this.updatePoints=[];
    }

    drawReverse(svg) {
        this.element.remove(); //removes it from DOM
    }


}


export class PaperActionRectangle {
    constructor(clientId, points, attributes) {
        this.element = new SVG().rect().attr(attributes);
        this.x = points[0];
        this.y = points[1];
        this.setxy(points[2], points[3]);
        this.element.node.id = clientId
        // this.client.element.move(points[0], points[1]);
    }

    //annoyingly a rectangle cant have negative width/heights...
    setxy(x2, y2)
    {
        let diff = x2 - this.x;
        if (diff > 0) {
            this.element.x(this.x);
            this.element.width(diff);
        } else {
            this.element.x(x2);
            this.element.width(-diff);
        }

        diff = y2 - this.y;
        if (diff > 0) {
            this.element.y(this.y);
            this.element.height(diff);
        } else {
            this.element.y(y2);
            this.element.height(-diff);
        }

    }

    addPoint(svgPoint) {
        this.updatePoint=svgPoint;

    }

    draw(svg) {
        svg.add(this.element);
    }

    drawUpdate()
    {
        this.setxy(this.updatePoint.x, this.updatePoint.y);
    }

    drawReverse(svg) {
        this.element.remove(); //removes it from DOM
    }


}




export class PaperAction {
    constructor(client, type, p1, p2, p3) {
        this.client = client;
        this.type = type;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }


    //apply action to svg
    apply(svg) {
        switch (this.type) {
            case event.IncrementalType.SelectDrawType:
                this.previous = this.client.drawType;
                this.client.drawType = this.p1;
                break;

            case event.IncrementalType.PointerStart:
                let attrs = {
                    'stroke': 'red',
                    'fill': 'none',
                    'stroke-width': 2
                };
                this.previous = this.client.element;

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
    reverse(svg) {

    }

    //get the undo of for action
    getUndo() {

    }

}