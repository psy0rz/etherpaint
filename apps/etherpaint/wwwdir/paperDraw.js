'use strict';
// stores and executes PaperActions
// keeps track of PaperClients


import PaperClient from "/paperClient.js";
import {SVG} from '@svgdotjs/svg.js/dist/svg.esm'
import {PaperActionUndo, PaperActionRedo} from "/paperAction.js";

export default class PaperDraw {

    constructor(paperElement, scratchElement) {
        this.paperElement = paperElement;
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
        this.updatedActions = new Set();

        this.paperSvg.clear();
        this.scratchSvg.clear();


    }


    streamStart()
    {
        this.clear();
        this.paperElement.dispatchEvent(new Event("streamStart"));
    }

    streamSynced()
    {
        this.paperElement.dispatchEvent(new Event("streamSynced"));
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
        // console.log("add action", action);
        if (store) {
            this.increments.push(action);
            this.targetIndex = this.increments.length - 1;
        } else {
            this.tmpActions.push(action);
            action.tmp=true;
        }

     //  this.requestDraw();
    }

    //add undo action
    addUndo(clientId) {
        let undoIndex = this.increments.length - 1;
        let undoSkip = 0;

        while (undoIndex > 0) {
            const action = this.increments[undoIndex];
            //its our action?
            if (action.clientId === clientId) {
                //it another undo action?
                if (action instanceof PaperActionUndo) {
                    //skip that action, when we encounter it
                    undoSkip++;
                } else {
                    //should we skip this action?
                    if (undoSkip > 0) {
                        undoSkip--;
                    } else {
                        //found the action we should undo
                        this.addAction(
                            new PaperActionUndo(
                                clientId,
                                action
                            ),
                            true);
                        return;
                    }
                }
            }
            undoIndex--;
        }

        // console.log("Cant undo any further.");

    }


    //add redo action
    addRedo(clientId) {
        let redoIndex = this.increments.length - 1;
        let redoSkip = 0;

        while (redoIndex > 0) {
            const action = this.increments[redoIndex];
            //its our action?
            if (action.clientId === clientId) {
                //it another redo action?
                if (action instanceof PaperActionRedo) {
                    //skip that undo, when we encounter it
                    redoSkip++;
                } else {
                    //found an undo?
                    if (action instanceof PaperActionUndo) {
                        //should we skip this action?
                        if (redoSkip > 0) {
                            redoSkip--;
                        } else {
                            //found the undo-action we should redo
                            this.addAction(
                                new PaperActionRedo(
                                    clientId,
                                    action
                                ),
                                true);
                            return;
                        }
                    }
                }
            }
            redoIndex--;
        }
        // console.log("Cant redo any further.");
    }

    //add cursor update to client
    updateCursor(clientId, x, y) {
        const client = this.getClient(clientId);
        client.cursorX = x;
        client.cursorY = y;
        this.changedClients.add(client);
        // this.requestDraw();

    }

    requestDraw() {
        if (!this.drawRequested) {
            window.requestAnimationFrame(this.draw.bind(this));
            this.drawRequested = true;
        }
    }


    //do actual drawing stuff, call this from inside an animation frame. (e.g. 60fps)
    draw() {
        this.drawRequested = false;

        //let all changed clients do their incremental draw and cursor stuff:
        for (const client of this.changedClients) {
            client.animateCursor();
        }
        this.changedClients.clear();

        for (const action of this.updatedActions) {
            action.drawUpdate();
        }
        this.updatedActions.clear();


        this.slideTo(this.targetIndex);
        this.drawTmpIncrements();


    }


    //draw increments until index. also store reverse increments or delete increments if they dont have a reverse.
    //increments without a reverse are usually only for visual effect. (e.g. when drawing a rectangle)
    //pay attention to performance in this one
    drawIncrements(index) {
        while (this.incrementIndex < index) {

            this.incrementIndex++;

            this.increments[this.incrementIndex].draw(this.paperSvg);


        }

    }


    drawTmpIncrements() {
        for (const action of this.tmpActions) {
            action.draw(this.scratchSvg);
        }
        this.tmpActions = [];

    }


    slideTo(index) {

        if (this.incrementIndex > index) {
            this.drawReverseIncrements(index);
            // console.log("REV");
        } else if (this.incrementIndex < index)
            this.drawIncrements(index);

    }

}
