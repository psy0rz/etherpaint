'use strict';
// stores and executes PaperActions
// keeps track of PaperClients


import PaperClient from "./paperClient.js";

export default class PaperDraw {

    constructor(paper_svg, scratch_svg) {
        this.paper_svg = paper_svg;
        this.scratch_svg = scratch_svg;
        this.clear();
    }

    clear() {
        this.clients = {};
        this.increments = [];
        this.reverse_increments = [];
        this.increment_index = -1;
        this.target_index = -1;

        this.changed_clients = new Set();
        this.paper_svg.clear();
        this.scratch_svg.clear();


    }

    // //sets our own client id
    // setClientId(id)
    // {
    //     this.client=this.getClient(id);
    // }

    //find or create PaperClient
    getClient = function (client_id) {
        let client = this.clients[client_id];
        if (!client)
            client = this.clients[client_id] = new PaperClient(client_id, this.paper_svg, this.scratch_svg);

        return (client);
    }

    //add incremental drawing command to stack
    addAction(action) {
        // let client=this.getclient(client_id);
        this.increments.push(action);

        // if (!this.paused)
        //     this.target_index = this.increments.length - 1;

    }

    //add cursor update to client
    updateCursor(client_id, cursor_event) {
        const client = this.getClient(client_id);
        client.cursorEvent(cursor_event);
        this.changed_clients.add(client);

    }


    //do actual drawing stuff, call this from inside an animation frame. (e.g. 60fps)
    draw() {
        //let all changed clients do their incremental draw and cursor stuff:
        for (const client of this.changed_clients) {
            client.animateCursor();
        }
        this.changed_clients.clear();


        this.slideTo(this.target_index);

    }


    //draw increments until index. also store reverse increments or delete increments if they dont have a reverse.
    //increments without a reverse are usually only for visual effect. (e.g. when drawing a rectangle)
    //pay attention to performance in this one
    drawIncrements(index) {
        while (this.increment_index < index) {

            this.increment_index++;

            this.increments[this.increment_index].apply(this.paper_svg);

            // const increment = this.increments[this.increment_index];
            // const client = this.getClient(increment[0]);
            // let reverse = [increment[0]]; //client_id
            // reverse = reverse.concat(client.drawIncrement(increment[1], increment[2], increment[3], increment[4]));
            //
            // //we have more items than the reverse array?
            // if (this.increment_index === this.reverse_increments.length) {
            //     //should we store it?
            //     if (increment[5]) //"store"
            //     {
            //         this.reverse_increments.push(reverse);
            //         // console.log("STORE", increment);
            //     } else {
            //         // console.log("SKIP", increment);
            //         //we dont have a reverse, so remove it from increments
            //         this.increments.splice(this.increment_index, 1);
            //         this.increment_index--;
            //         this.target_index--;
            //         index--;
            //     }
            // }

            // console.log("drawn: i=",this.increment_index, index, increment);

        }

        // console.log("increments", index, this.increment_index);
    }


    // drawReverseIncrements(index) {
    //     while (this.increment_index > index) {
    //
    //         const increment = this.reverse_increments[this.increment_index];
    //         if (!(increment === undefined)) {
    //             const client = this.getClient(increment[0]);
    //
    //             client.drawIncrement(increment[1], increment[2], increment[3], increment[4]);
    //         }
    //
    //         this.increment_index = this.increment_index - 1;
    //
    //     }
    //
    // }


    slideTo(index) {

        // console.log("SLIDE", this.increment_index, index);
        if (this.increment_index > index) {
            this.drawReverseIncrements(index);
            // console.log("REV");
        } else if (this.increment_index < index)
            this.drawIncrements(index);

    }

}
