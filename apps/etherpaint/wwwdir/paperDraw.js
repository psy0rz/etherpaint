'use strict';
// stores and executes PaperActions
// keeps track of PaperClients


import PaperClient from "./paperClient.js";
import { SVG } from './node_modules/@svgdotjs/svg.js/dist/svg.esm.js'
// import { SVG } from '@svgdotjs/svg.js'

export default class PaperDraw {

    constructor(paperElement, scratchElement) {
        this.paperSvg = SVG(paperElement);
        this.scratchSvg = SVG(scratchElement);
        this.clear();
    }

    clear() {
        this.clients = {};
        this.increments = [];
        this.tmpActions = [];
        this.incrementIndex = -1;
        this.targetIndex = -1;

        this.changedClients = new Set();
        this.paperSvg.clear();
        this.scratchSvg.clear();


    }

    // //sets our own client id
    // setClientId(id)
    // {
    //     this.client=this.getClient(id);
    // }

    //find or create PaperClient
    getClient = function (clientId) {
        let client = this.clients[clientId];
        if (!client)
            client = this.clients[clientId] = new PaperClient(clientId, this.scratchSvg);

        return (client);
    }

    //add incremental drawing command to stack
    addAction(action, store) {
        if (store) {
            this.increments.push(action);
            this.targetIndex = this.increments.length - 1;
        }
        else
        {
            this.tmpActions.push(action);
        }

        this.requestDraw();
    }


    //add cursor update to client
    updateCursor(clientId, cursorEvent) {
        const client = this.getClient(clientId);
        client.cursorEvent=cursorEvent;
        this.changedClients.add(client);

        this.requestDraw();

    }

    requestDraw() {
        if (!this.drawRequested) {
            window.requestAnimationFrame(this.draw.bind(this));
            this.drawRequested = true;
        }
    }


    //do actual drawing stuff, call this from inside an animation frame. (e.g. 60fps)
    draw() {
        this.drawRequested=false;

        //let all changed clients do their incremental draw and cursor stuff:
        for (const client of this.changedClients) {
            client.animateCursor();
        }
        this.changedClients.clear();

        this.slideTo(this.targetIndex);
        this.drawTmpIncrements();


    }


    //draw increments until index. also store reverse increments or delete increments if they dont have a reverse.
    //increments without a reverse are usually only for visual effect. (e.g. when drawing a rectangle)
    //pay attention to performance in this one
    drawIncrements(index) {
        while (this.incrementIndex < index) {

            this.incrementIndex++;

            this.increments[this.incrementIndex].apply(this.paperSvg);


        }

    }


    drawTmpIncrements()
    {
        for (const action of this.tmpActions) {
            action.apply(this.paperSvg);
        }
        this.tmpActions=[];

    }


    slideTo(index) {

        if (this.incrementIndex > index) {
            this.drawReverseIncrements(index);
            // console.log("REV");
        } else if (this.incrementIndex < index)
            this.drawIncrements(index);

    }

}
