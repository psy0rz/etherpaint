'use strict';

//receive commands from gui and send to server

//most stuff is queued or cached before sending an actual message.

import {event} from "./messages_generated.js";


export default class PaperSend {


    contructor(messages) {
        this.messages = messages;

    }


    //send queued stuff and add cursor if we have any
    //only sends if output buffer of websocket is empty
    sendQueue()
    {
        //buffer empty enough?
        //todo: some kind of smarter throttling
        if (this.messages.ws && this.messages.ws.bufferedAmount === 0) {
            //anything to send at all?
            if (this.cursorMoved || !this.messages.is_empty()) {

                if (this.cursorMoved) {
                    //add latest cursor event
                    this.messages.add_event(
                        event.EventUnion.Cursor,
                        event.Cursor.createCursor(
                            this.messages.builder,
                            this.clientId,
                            this.cursorX,
                            this.cursorY,
                        ))
                    this.cursorMoved = false;
                }

                this.messages.send();
            }
        }
    }

    setClientId(clientId)
    {
        this.clientId=clientId;
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


        }
    }

    //this is main function that is called from control.js to send actual drawing commands.
    drawIncrement(type, p1, p2, p3) {

        // console.log(type, p1, p2, p3);

        //
        //
        // //delete temporary object if there is any
        // if (type === event.IncrementalType.PointerEnd) {
        //     if (paper.echo_client.current_element) {
        //         paper.echo_client.current_element.remove();
        //         paper.echo_client.current_element = undefined;
        //     }
        // }

        this.messages.add_event(
            event.EventUnion.DrawIncrement,
            event.DrawIncrement.createDrawIncrement(
                this.messages.builder,
                this.clientId,
                type,
                p1,
                p2,
                p3,
            ));

        // if (test.recording)
        //     test.record([type, p1, p2, p3]);

    }

    selectDrawType(drawType)
    {
        this.queueDrawIncrement(event.IncrementalType.SelectDrawType,drawType );

    }




}
