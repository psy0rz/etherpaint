'use strict';

import {event} from "./messages_generated.js";
import {Builder, ByteBuffer} from "flatbuffers";

export default class Messages {

    constructor(connected_handler) {
        //fixed builder we reuse every time we send a message
        this.builder = new Builder(1000);
        this.clear();

        this.connected_handler=connected_handler;

        //this array will get assigned the actual handlers, one for each EventUnion type from messages.fbs
        this.handlers = [];

        //overwrite this with your own function, called after all handlers are called
        this.done_handler=function() { };
    };

    //clear buffers, start new message.
    clear() {
        this.builder.clear();
        this.event_types = [];
        this.event_offsets = [];
    }

    is_empty() {
        return (this.event_types.length === 0);
    }

    //add event to message we're building. (you'll have to use this.builder directly in the create...() functions)
    add_event(event_type, event_offset) {
        this.event_types.push(event_type);
        this.event_offsets.push(event_offset);
    }

    //contructs final message from collected events and sends it.
    send() {
        this.builder.finish(
            event.Message.createMessage(
                this.builder,
                event.Message.createEventsTypeVector(this.builder, this.event_types),
                event.Message.createEventsVector(this.builder, this.event_offsets)
            )
        );

        let msgArray = this.builder.asUint8Array();
        // console.log("send", msgArray.length);
        this.ws.send(msgArray);

        this.clear();
    }

    log(txt) {
        console.debug("messages.js: " + txt);
    }

    delayed_reconnect() {
        if (document.URL.search("debug") === -1) {
            let self=this;
            setTimeout(function()
            {
                self.connect();
            }, 1000);
        } else {
            //debug mode, reload page to make developing easier:
            setTimeout(function () {
                location.reload()
            }, 100);
        }
    }

    connect(auto_reconnect) {

        let self=this;

        if (!"WebSocket" in window) {
            alert("WebSockets NOT supported by your Browser!");
            return;
        }

        var ws_url;
        if (location.protocol === 'http:') {
            ws_url = "ws://" + location.host + "/ws";
        } else {
            ws_url = "wss://" + location.host + "/ws";

        }
        this.log("Connecting to " + ws_url);

        this.clear();
        this.ws = new WebSocket(ws_url);
        this.ws.binaryType = 'arraybuffer';

        // connected
        this.ws.onopen = function () {
            self.log("Connected");
            document.dispatchEvent(new Event("wsConnected"));
            if (self.connected_handler)
                self.connected_handler();
        };

        // receive websocket messages.
        this.ws.onmessage = function (wsEvent) {
            let eventArray = new Uint8Array(wsEvent.data);
            // console.log("recv", msgArray.length);
            self.call_handlers(eventArray);
        }

        this.ws.onerror = function (evt) {
            self.log('Connection error');
            document.dispatchEvent(new Event("wsDisconnected"));
        };

        this.ws.onclose = function (evt) {
            self.log('Disconnected');
            document.dispatchEvent(new Event("wsDisconnected"));
            if (auto_reconnect)
                self.delayed_reconnect();
        };
    }

    disconnect()
    {
        this.auto_reconnect=false;
        this.ws.close();
    }

    unknown_handler(msg, event_index)
    {

        this.log("Handler not found: " + event.EventUnionName[msg.eventsType(event_index)]);
    }




    //calls the actual handlers for each receive event inside a message.
    call_handlers(eventArray) {
        let byteBuffer = new ByteBuffer(eventArray);
        let msg = event.Message.getRootAsMessage(byteBuffer);

        let events_length = msg.eventsLength();

        for (let event_index = 0; event_index < events_length; event_index++) {
            let handler = this.handlers[msg.eventsType(event_index)];
            if (handler !== undefined) {
                handler(msg, event_index);
            } else {
                this.unknown_handler(msg, event_index);
            }
        }

        this.done_handler();
    };

}

