'use strict';

//keep per-client state (cursors, colors, tool type etc) and do the actual svg stuff
export default class PaperClient {
    constructor(clientId, scratchSvg) {
        this.clientId = clientId;

        //current svg element we're building/modfiying
        // this.current_element = undefined;
        // this.next_object_id = 0;
        this.drawType = undefined;
        this.element = undefined;


        //create cursor
        this.cursorSvg = scratchSvg.group();
        this.cursorSvg.path('M-10,0 L10,0 M0,-10 L0,10').stroke('black');
        this.cursorSvg.text("client " + this.clientId);

    }


    animateCursor() {

        this.cursorSvg.transform({
            translateX: this.cursorEvent.x(),
            translateY: this.cursorEvent.y()
        });
    }

}
