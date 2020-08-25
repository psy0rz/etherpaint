'use strict';

//m (messages)
var m = {};

//fixed builder we reuse every time we send a message
m.builder = new flatbuffers.Builder(1);

//sends current builder
m.send = function () {
    m.ws.send(m.builder.asUint8Array());
}


m.log = function (txt) {
    console.debug("messages.js: " + txt);
}

m.handlers = [];

m.delayed_restart = function () {
    setTimeout(m.restart, 1000);
}


m.start = function(connectcb)
{
    m.connectcb=connectcb;
    m.restart();
}

m.restart = function () {
    if (!"WebSocket" in window) {
        alert("WebSockets NOT supported by your Browser!");
        return;
    }

    var ws_url;
    if (location.protocol == 'http:') {
        ws_url = "ws://" + location.host + "/ws";
    }
    else {
        ws_url = "wss://" + location.host + "/ws";

    }
    m.log("Connecting to " + ws_url);

    m.ws = new WebSocket(ws_url);
    m.ws.binaryType = 'arraybuffer';

    m.ws.onopen = function () {
        m.log("Connected");
        m.connectcb();
    };

    m.ws.onmessage = function (evt) {
        var buf = new flatbuffers.ByteBuffer(new Uint8Array(evt.data));
        var msg = event.Message.getRootAsMessage(buf);

        var handler = m.handlers[msg.eventType()];
        if (handler) {
            handler(msg);
        }
        else {
            m.log("Handler not found: " + event.EventUnionName[msg.eventType()])
        }
    };

    m.ws.onerror = function (evt) {
        m.log('Connection error');
    };

    m.ws.onclose = function (evt) {
        m.log('Disconnected, reconnecting.');
        m.delayed_restart();
    };

}

