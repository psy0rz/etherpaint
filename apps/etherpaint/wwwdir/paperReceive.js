'use strict';

//receive actions from server and pass them to paperDraw.js

import {event} from "./messages_generated.js";
import {PaperActionPolyline, PaperActionRectangle, PaperActionDelete, PaperActionCircle} from "./paperAction.js";

//maps event classtype number to actual javascript class
const classTypeMap = [];
classTypeMap[event.ClassType.Polyline] = PaperActionPolyline;
classTypeMap[event.ClassType.Rectangle] = PaperActionRectangle;
classTypeMap[event.ClassType.Circle] = PaperActionCircle;


export default class PaperReceive {

    constructor(messages, paperDraw, paperSend) {

        this.messages = messages;
        this.paperDraw = paperDraw;
        this.paperSend = paperSend;

        this.messages.done_handler = () => {
            this.paperDraw.requestDraw();
        }

        //server tells us we are joined to a new session.
        this.messages.handlers[event.EventUnion.StreamStart] = (msg, eventIndex) => {
            const e = msg.events(eventIndex, new event.StreamStart());

            console.log("Started stream: ", e.paperId());

            this.clientId = 0; //no client yet (prevents echo skip-code)
            this.paperSend.setClientId(0);
            this.paperDraw.streamStart();
        };

        this.messages.handlers[event.EventUnion.StreamSynced] = (msg, eventIndex) => {
            const e = msg.events(eventIndex, new event.StreamSynced());
            console.log("Stream synced, clientId:", e.clientId());
            this.clientId = e.clientId();
            this.paperSend.setClientId(this.clientId)
            this.paperDraw.streamSynced();

        }


        //received an incremental draw
        this.messages.handlers[event.EventUnion.DrawIncrement] = (msg, eventIndex) => {
            const drawIncrementEvent = msg.events(eventIndex, new event.DrawIncrement());

            const clientId = drawIncrementEvent.clientId();
            const store = drawIncrementEvent.store();

            //ignore our own events, these are handled by local echo
            if (clientId === this.clientId)
                return;


            this.drawIncrement(
                clientId,
                drawIncrementEvent.type(),
                drawIncrementEvent.p1(),
                drawIncrementEvent.p2(),
                drawIncrementEvent.p3(),
                store
            );


        }

        //received points to draw an object
        this.messages.handlers[event.EventUnion.DrawObject] = (msg, eventIndex) => {

            const drawObjectEvent = msg.events(eventIndex, new event.DrawObject());
            const clientId = drawObjectEvent.clientId();

            //ignore our own events, these are handled by local echo
            if (clientId === this.clientId)
                return;


            //transform into regular array
            let points = [];
            for (const n of drawObjectEvent.pointsArray())
                points.push(n);
            // console.log("drawobject", clientId, points);


            this.drawObject(clientId, points);

        };


        //received a cursor event.
        //only store/replace it to handle performance issues gracefully. (e.g. skip updates instead of queue them)
        this.messages.handlers[event.EventUnion.Cursor] = (msg, eventIndex) => {
            const cursorEvent = msg.events(eventIndex, new event.Cursor());
            const clientId = cursorEvent.clientId();

            if (clientId === this.clientId)
                return;

            this.updateCursor(clientId, cursorEvent.x(), cursorEvent.y())

        }

        //a client joined the current session
        this.messages.handlers[event.EventUnion.ClientJoined] = (msg, eventIndex) => {
            const clientJoinedEvent = msg.events(eventIndex, new event.ClientJoined());
            const clientId = clientJoinedEvent.clientId();
            this.paperDraw.showClient(clientId);
        }

        //a client left the current session
        this.messages.handlers[event.EventUnion.ClientLeft] = (msg, eventIndex) => {
            const clientLeftEvent = msg.events(eventIndex, new event.ClientLeft());
            const clientId = clientLeftEvent.clientId();
            const client = this.paperDraw.getClient(clientId);
            this.paperDraw.hideClient(clientId);
        }

    }



    drawIncrement(clientId, type, p1, p2, p3, store) {

        const client = this.paperDraw.getClient(clientId);
        // console.log("increment", clientId, type, p1,p2,p3,store);

        switch (type) {
            case event.IncrementalType.SelectClass:
                client.Class = classTypeMap[p1]
                break;
            case event.IncrementalType.SelectColor:
                // let color = p1 << 16 + p2 << 8 + p3;
                // client.attributes['stroke'] = "#" + color.toString(16).padStart(6, '0');
                client.selectAttribute('c', 'c' + p1);
                break;
            case event.IncrementalType.SelectWidth:
                client.selectAttribute('w', 'w' + p1);
                break;
            case event.IncrementalType.SelectDashing:
                client.selectAttribute('d', 'd' + p1);
                break;
            case event.IncrementalType.DrawObject:
                client.currentAction = new client.Class(
                    clientId,
                    client.getNextId(),
                    [p1, p2],
                    client.attributeClassStr);
                this.paperDraw.addAction(client.currentAction, store);
                break;
            case event.IncrementalType.AddPoint:
                let svgPoint = this.paperDraw.paperSvg.node.createSVGPoint();
                svgPoint.x = p1;
                svgPoint.y = p2;
                client.currentAction.addPoint(svgPoint);
                this.paperDraw.updatedActions.add(client.currentAction);
                break;
            case event.IncrementalType.Cancel:
                this.paperDraw.addAction(new PaperActionDelete(
                    clientId,
                    client.currentAction.element
                ), store);
                client.currentAction = undefined;
                break;
            //client disconnected
            case event.IncrementalType.Cleanup:
                //is the current action temporary?
                if (client.currentAction !== undefined && client.currentAction.tmp) {
                    this.paperDraw.addAction(new PaperActionDelete(
                        clientId,
                        client.currentAction.element
                    ), store);
                    client.currentAction = undefined;
                }
                break;

            case event.IncrementalType.Undo:
                this.paperDraw.addUndo(clientId);
                break;
            case event.IncrementalType.Redo:
                this.paperDraw.addRedo(clientId);
                break;
        }
    }

    drawObject(clientId, points) {
        const client = this.paperDraw.getClient(clientId);
        client.currentAction = new client.Class(
            clientId,
            client.getNextId(),
            points,
            client.attributeClassStr);
        this.paperDraw.addAction(client.currentAction, true);
    }

    updateCursor(clientId, x, y) {
        this.paperDraw.updateCursor(clientId, x, y);
    }

}