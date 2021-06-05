'use strict';

import {SVG} from '@svgdotjs/svg.js/dist/svg.esm';

//keep per-client state (cursors, colors, tool type etc) and do the actual svg stuff
export default class PaperClient {
    constructor(clientId, scratchSvg) {
        this.clientId = clientId;
        //next uniq id for draw objects
        this.nextId = clientId * 1000000;

        //selected drawing class
        this.Class = undefined;

        //current action the client is working on (used by add points)
        this.action = undefined;

        //selected attribute classes for new svg objects. (see paper.css)
        this.attributeClasses = {};
        this.attributeClassStr = "";


        //create cursor
        this.element = new SVG().group();
        this.element.path('M-20,0 L20,0 M0,-20 L0,20');
        this.element.text("client " + this.clientId).addClass("cursor-text").dy(-50);

        this.cursorX = 0;
        this.cursorY = 0;

    }

    getNextId() {
        this.nextId = this.nextId + 1;
        return (this.nextId);
    }

    animateCursor() {

        this.element.transform({
            translateX: this.cursorX,
            translateY: this.cursorY
        });
    }

    show(svg)
    {
        svg.add(this.element);
    }

    hide()
    {
        this.element.remove(); //removes it from DOM
    }

    selectAttribute(attribute, attributeClass) {
        this.element.removeClass(this.attributeClasses[attribute]);
        this.element.addClass(attributeClass);

        this.attributeClasses[attribute]=attributeClass;
        this.attributeClassStr=Object.values(this.attributeClasses).join(' ');


    }


}
