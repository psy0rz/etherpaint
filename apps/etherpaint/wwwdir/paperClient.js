'use strict';

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
        this.cursorSvg = scratchSvg.group();
        this.cursorSvg.path('M-20,0 L20,0 M0,-20 L0,20');
        this.cursorSvg.text("client " + this.clientId).size(100);

        this.cursorX = 0;
        this.cursorY = 0;

    }

    getNextId() {
        this.nextId = this.nextId + 1;
        return (this.nextId);
    }

    animateCursor() {

        this.cursorSvg.transform({
            translateX: this.cursorX,
            translateY: this.cursorY
        });
    }

    selectAttribute(attribute, attributeClass) {
        this.cursorSvg. removeClass(this.attributeClasses[attribute]);
        this.cursorSvg.addClass(attributeClass);

        this.attributeClasses[attribute]=attributeClass;
        this.attributeClassStr=Object.values(this.attributeClasses).join(' ');


    }


}
