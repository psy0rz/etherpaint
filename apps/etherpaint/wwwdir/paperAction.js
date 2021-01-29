'use strict';
//The actual draw actions.
//These are updatable with extra points for realtime updates.
//Action are also reversable. This is used for the timeslider and undo/redo functions.
//
//Drawing is done in animation frames.

import {SVG} from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js';


export class PaperActionPolyline {
    constructor(clientId, id,  points, classStr) {
        this.clientId=clientId;
        this.element = new SVG().polyline(points).addClass(classStr);
        this.element.node.id = id;
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
    constructor(clientId, id, points, classStr) {
        this.clientId=clientId;
        this.element = new SVG().rect().addClass(classStr);
        this.x = points[0];
        this.y = points[1];
        this.setxy(points[2], points[3]);
        this.element.node.id = id;
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




export class PaperActionCircle {
    constructor(clientId, id, points, classStr) {
        this.clientId=clientId;
        this.element = new SVG().ellipse().addClass(classStr);
        this.x = points[0];
        this.y = points[1];
        this.setxy(points[2], points[3]);
        this.element.node.id = id;
        // this.client.element.move(points[0], points[1]);
    }

    //annoyingly a rectangle cant have negative width/heights...
    setxy(x2, y2)
    {
        this.element.cx(this.x);
        this.element.cy(this.y);
        this.element.width(Math.abs(this.x-x2)*2);
        this.element.height(Math.abs(this.y-y2)*2);

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


export class PaperActionDelete {
    constructor(clientId, element) {
        this.clientId=clientId;
        this.element = element;
    }

    draw(svg) {
        this.element.remove(); //remove from DOM
    }

    drawReverse(svg) {
        svg.add(this.element);
    }
}



export class PaperActionUndo {
    constructor(clientId, action) {
        this.clientId=clientId;
        this.action=action;
    }

    draw(svg) {
        this.action.drawReverse(svg);
    }

    drawReverse(svg) {
        this.action.draw(svg);
    }
}

//basically points to a paperactionundo that will be reversed. (resulting in a normal draw of the original action)
export class PaperActionRedo {
    constructor(clientId, undoAction) {
        this.clientId=clientId;
        this.undoAction=undoAction;
    }

    draw(svg) {
        this.undoAction.drawReverse(svg);
    }

    drawReverse(svg) {
        this.undoAction.draw(svg);
    }
}
