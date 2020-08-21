'use strict';

//m (messages)
var m = {};

//fixed builder we reuse every time we send a message
m.builder = new flatbuffers.Builder(1);

m.log = function (txt) {
    console.debug("messages.js: " + txt);
}

m.handlers = [];

m.delayed_restart = function () {
    setTimeout(this.restart, 1000);
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

    this.ws = new WebSocket(ws_url);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = function () {
        m.log("Connected");
    };

    this.ws.onmessage = function (evt) {
        var buf = new flatbuffers.ByteBuffer(new Uint8Array(evt.data));
        var msg = event.Message.getRootAsMessage(buf);

        this.handlers[msg.eventType](msg);

    };

    this.ws.onclose = function (evt) {
        m.log('Disconnected, reconnecting.');
        this.delayed_restart();
    };

    this.ws.onerror = function (evt) {
        m.log('Error, reconnecting');
        this.delayed_restart();
    };

}

m.start = m.restart;


//setTimeout(open, 100);
