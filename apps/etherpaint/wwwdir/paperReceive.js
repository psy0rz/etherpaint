'use strict';

//receive actions from server and pass them to paperDraw.js

import {event} from "./messages_generated.js";
import {PaperActionPolyline, PaperActionRectangle, PaperActionDelete} from "./paperAction.js";

//maps event classtype number to actual javascript class
const classTypeMap = [];
classTypeMap[event.ClassType.Polyline] = PaperActionPolyline;
classTypeMap[event.ClassType.Rectangle] = PaperActionRectangle;


export default class PaperReceive {

    constructor(messages, paperDraw, paperSend) {

        this.messages = messages;
        this.paperDraw = paperDraw;
        this.paperSend = paperSend;

        //server tells us we are joined to a new session.
        this.messages.handlers[event.EventUnion.Join] = (msg, eventIndex) => {
            const join = msg.events(eventIndex, new event.Join());
            console.log("Joined shared session", join.id(), "as client", join.clientId());
            this.clientId = join.clientId();
            this.paperDraw.clear();
            this.paperSend.setClientId(this.clientId)
        };

        //received an incremental draw
        this.messages.handlers[event.EventUnion.DrawIncrement] = (msg, eventIndex) => {
            const drawIncrementEvent = msg.events(eventIndex, new event.DrawIncrement());
            const client = this.paperDraw.getClient(drawIncrementEvent.clientId());

            switch (drawIncrementEvent.type()) {
                case event.IncrementalType.SelectClass:
                    client.Class = classTypeMap[drawIncrementEvent.p1()]
                    break;
                case event.IncrementalType.SelectColor:
                    let color = drawIncrementEvent.p1() << 16 + drawIncrementEvent.p2() << 8 + drawIncrementEvent.p3();
                    client.attributes['stroke'] = "#" + color.toString(16).padStart(6, '0');
                    break;
                case event.IncrementalType.DrawObject:
                    client.currentAction = new client.Class(
                        client.getNextId(),
                        [drawIncrementEvent.p1(), drawIncrementEvent.p2()],
                        client.attributes);
                    this.paperDraw.addAction(client.currentAction, drawIncrementEvent.store());
                    break;
                case event.IncrementalType.AddPoint:
                    let svgPoint = this.paperDraw.paperSvg.node.createSVGPoint();
                    svgPoint.x = drawIncrementEvent.p1();
                    svgPoint.y = drawIncrementEvent.p2();
                    client.currentAction.addPoint(svgPoint);
                    this.paperDraw.updatedActions.add(client.currentAction);
                    break;
                case event.IncrementalType.Cancel:
                    this.paperDraw.addAction(new PaperActionDelete(
                        client.currentAction.element
                    ), drawIncrementEvent.store());
                    client.currentAction=undefined;
                    break;
            }

        }

        //received points to draw an object
        this.messages.handlers[event.EventUnion.DrawObject] = (msg, eventIndex) => {

            const drawObjectEvent = msg.events(eventIndex, new event.DrawObject());
            const client = this.paperDraw.getClient(drawObjectEvent.clientId());

            //transform into regular array
            let points = [];
            for (const n of drawObjectEvent.pointsArray())
                points.push(n);

            client.currentAction = new client.Class(
                client.getNextId(),
                points,
                client.attributes);
            this.paperDraw.addAction(client.currentAction, true);
        };

        //received a cursor event.
        //only store/replace it to handle performance issues gracefully. (e.g. skip updates instead of queue them)
        this.messages.handlers[event.EventUnion.Cursor] = (msg, eventIndex) => {
            const cursorEvent = msg.events(eventIndex, new event.Cursor());
            const clientId = cursorEvent.clientId();

            this.paperDraw.updateCursor(clientId, cursorEvent);

        }

        //received an error
        this.messages.handlers[event.EventUnion.Error] = (msg, eventIndex) => {
            const error = msg.events(eventIndex, new event.Error());
            console.error("Server reports error: " + error.description());
        }

    }

}