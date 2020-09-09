'use strict';

class PaperClient {
    constructor(client_id) {
        this.client_id = client_id;
        this.increment_events = [];

        //create cursor
        this.cursor_svg = paper.scratch_svg.group();
        this.cursor_svg.path('M-10,0 L10,0 M0,-10 L0,10').stroke('black');
        this.cursor_svg.text("client " + client_id);

    }

    //store latest cursor postion
    cursorEvent(cursor_event) {
        this.cursor_event = cursor_event;
        this.cursor_changed = true;
    }

    //enqueue all draw increments.
    drawIncrementEvent(draw_increment) {
        this.increment_events.push(draw_increment);
    }

    //use all collected data to do svg drawing actions
    animate()
    {
        //update cursor position?
        if (this.cursor_changed) {
            this.cursor_svg.transform({
                translateX: this.cursor_event.x(),
                translateY: this.cursor_event.y()
            });
            this.cursor_changed = false;
        }

    }
}