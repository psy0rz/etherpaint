'use strict';

//receive actions from server and pass them to paperDraw.js

import {event} from "./messages_generated.js";
import {PaperAction, PaperActionPolyline, PaperActionAddPoint} from "./paperAction.js";


/*
actionfull
actionincStart
actionincAdd
actionincEnd


 */
//maps event classtype number to actual javascript class
const classTypeMap = [];
classTypeMap[event.ClassType.Polyline] = PaperActionPolyline;
// classTypeMap[event.ClassType.Rect]=PaperActionRect;

//map

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
                    console.log("Class", client.Class);
                    break;
                case event.IncrementalType.SelectColor:
                    let color = drawIncrementEvent.p1() << 16 + drawIncrementEvent.p2() << 8 + drawIncrementEvent.p3();
                    client.attributes['stroke'] = "#" + color.toString(16).padStart(6, '0');
                    break;
                case event.IncrementalType.DrawObject:
                    this.paperDraw.addAction(
                        new client.Class(
                            client,
                            [drawIncrementEvent.p1(), drawIncrementEvent.p2()],
                            client.attributes
                        ),
                        drawIncrementEvent.store()
                    );
                    break;
                case event.IncrementalType.AddPoint:
                    this.paperDraw.addTmpAction(
                        new PaperActionAddPoint(
                            client,
                            [drawIncrementEvent.p1(), drawIncrementEvent.p2()],
                        ),
                        drawIncrementEvent.store()
                    );
                    break;
            }

        }

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