'use strict';

//receive actions from server and pass them to paperDraw.js

import {event} from "./messages_generated.js";
import PaperAction from "./paperAction.js";


export default class PaperReceive {

    constructor(messages, paperDraw, paperSend) {

        this.messages = messages;
        this.paperDraw = paperDraw;
        this.paperSend=paperSend;

        //server tells us we are joined to a new session.
        this.messages.handlers[event.EventUnion.Join] = (msg, event_index) =>     {
            const join = msg.events(event_index, new event.Join());
            console.log("Joined shared session", join.id(), "as client", join.clientId());
            this.clientId = join.clientId();
            this.paperDraw.clear();
            this.paperSend.setClientId(this.clientId)
        };

        //received an incremental draw
        this.messages.handlers[event.EventUnion.DrawIncrement] = (msg, event_index) => {
            const draw_increment_event = msg.events(event_index, new event.DrawIncrement());

            const action = new PaperAction(
                this.paperDraw.getClient(draw_increment_event.clientId()),
                draw_increment_event.type(),
                draw_increment_event.p1(),
                draw_increment_event.p2(),
                draw_increment_event.p3(),
                draw_increment_event.store()
            );

            this.paperDraw.addAction(action);
        }

        //received a cursor event.
        //only store/replace it to handle performance issues gracefully. (e.g. skip updates instead of queue them)
        this.messages.handlers[event.EventUnion.Cursor] = (msg, event_index) => {
            const cursor_event = msg.events(event_index, new event.Cursor());
            const client_id = cursor_event.clientId();

            this.paperDraw.updateCursor(client_id, cursor_event);

        }

        //received an error
        this.messages.handlers[event.EventUnion.Error] = (msg, event_index) => {
            const error = msg.events(event_index, new event.Error());
            console.error("Server reports error: " + error.description());
        }

    }

}