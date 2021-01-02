'use strict';

//receive commands from gui and send to server

//most stuff is queued or cached before sending an actual message.

import {event} from "./messages_generated.js";


export default class PaperSend {


    constructor(messages) {
        this.messages = messages;
        this.points = [];

    }


    //send queued stuff and add cursor if we have any
    //only sends if output buffer of websocket is empty
    send() {
        // this.scheduled = false;
        //buffer empty enough?
        //todo: some kind of smarter throttling
        // if (this.messages.ws && this.messages.ws.bufferedAmount === 0) {
        if (this.messages.ws) {
            //anything to send at all?
            if (this.cursorMoved || !this.messages.is_empty()) {

                //add latest cursor event?
                if (this.cursorMoved) {

                    this.messages.add_event(
                        event.EventUnion.Cursor,
                        event.Cursor.createCursor(
                            this.messages.builder,
                            this.clientId,
                            this.cursorX,
                            this.cursorY,
                        ));

                    this.cursorMoved = false;


                }

                //send all queued stuff
                this.messages.send();
            }
        }
        // } else {
        //     //try again l
        //     this.scheduleSend();
        // }
    }

    //schedule a call to send (if its not already scheduled)
    scheduleSend() {
        // this.send();
        // if (!this.scheduled) {
        //     this.scheduled = true;
        //     setTimeout(this.send.bind(this), 1000 / 60); //within 1 frame of 60fps
        // }
    }

    setClientId(clientId) {
        this.clientId = clientId;
    }

    //send join to server
    join(id) {
        this.messages.add_event(
            event.EventUnion.Join,
            event.Join.createJoin(
                this.messages.builder,
                this.messages.builder.createString(id)
            ));

    }

    //update cursor info (will be sent later)
    updateCursor(x, y) {

        if (this.cursorX !== x || this.cursorY !== y) {
            this.cursorX = x;
            this.cursorY = y;
            this.cursorMoved = true;
            // if (test.recording)
            //     test.record([x, y]);
            this.paperReceive.updateCursor(this.clientId, x, y);


        }
    }

    //this is main function that is called from control.js to send actual drawing commands.
    drawIncrement(type, p1, p2, p3, store) {


        this.messages.add_event(
            event.EventUnion.DrawIncrement,
            event.DrawIncrement.createDrawIncrement(
                this.messages.builder,
                this.clientId,
                type,
                p1,
                p2,
                p3,
                store
            ));

        //local echo
        this.paperReceive.drawIncrement(this.clientId, type, p1, p2, p3, store);

        // if (test.recording)
        //     test.record([type, p1, p2, p3]y

    }

    selectDrawClass(drawClass) {
        this.drawIncrement(event.IncrementalType.SelectClass, drawClass, 0, 0, true);
        this.selectedClass = drawClass;

    }

    //start temporary realtime updated object of selected draw class.
    //this will store the points and send a final complete drawObject to the server after calling drawFinish.
    //this object is also optimized so it has less points, in case of polylines.
    drawStart(x, y) {
        if (x < 0 || y < 0)
            return;

        this.drawIncrement(event.IncrementalType.DrawObject, x, y, 0, false);
        this.points = [x, y];
        this.lastX = x;
        this.lastY = y;
    }

    //update with new points. still send as temporary and for animation only. (we store them in this class to send as permanent on finish)
    drawUpdate(x, y) {
        if (x < 0 || y < 0)
            return;

        if (x !== this.lastX || y !== this.lastY) {
            this.lastX = x;
            this.lastY = y;

            this.drawIncrement(event.IncrementalType.AddPoint, x, y, 0, false);

            switch (this.selectedClass) {
                case event.ClassType.Polyline:
                    this.points.push(x);
                    this.points.push(y);
                    break;
                case event.ClassType.Rectangle:
                    this.points[2] = x;
                    this.points[3] = y;
                    break;
            }
        }
    }


    drawCancel() {
        if (this.points.length) {
            this.drawIncrement(event.IncrementalType.Cancel, 0, 0, 0, false);
            this.points = [];
        }
    }

    //transform temporary points in final message.
    drawFinish() {


        //TODO: optimize polyline with https://mourner.github.io/simplify-js/

        this.drawIncrement(event.IncrementalType.Cancel, 0, 0, 0, false);
        this.drawObject(this.points);
        this.points = [];

    }

    //draw object with specified points array (usually send after a drawstart/drawaddpoints/drawfinish cycle)
    drawObject(points) {

        if (points.length) {


            this.messages.add_event(
                event.EventUnion.DrawObject,
                event.DrawObject.createDrawObject(
                    this.messages.builder,
                    this.clientId,
                    event.DrawObject.createPointsVector(this.messages.builder, points)
                ));

            this.paperReceive.drawObject(this.clientId,points);

        }

    }

    undo(steps)
    {
        this.drawIncrement(event.IncrementalType.Undo, steps, 0, 0, true);

    }

    redo(steps)
    {
        this.drawIncrement(event.IncrementalType.Redo, steps, 0, 0, true);

    }

}
