'use strict';

//keep per-client state (cursors, colors, tool type etc) and do the actual svg stuff
export default class PaperClient {
    constructor(clientId, scratchSvg) {
        this.clientId = clientId;
        //next uniq id for draw objects
        this.nextId=clientId*1000000;

        //selected drawing class
        this.Class = undefined;

        //current action the client is working on (used by add points)
        this.action = undefined;

        //attributes for new svg objects (color etc)
        this.attributes = {
            'stroke': '#000000',
            'fill': 'none',
            'stroke-width': 4
        };



        //create cursor
        this.cursorSvg = scratchSvg.group();
        this.cursorSvg.path('M-40,0 L40,0 M0,-40 L0,40').attr(
            {
                'stroke': '#000000',
                'stroke-width': 4

            });
        this.cursorSvg.text("client " + this.clientId);


    }

    getNextId()
    {
        this.nextId=this.nextId+1;
        return(this.nextId);
    }

    animateCursor() {

        this.cursorSvg.transform({
            translateX: this.cursorEvent.x(),
            translateY: this.cursorEvent.y()
        });
    }

}
