'use strict';
//quick and dirty test system that records/playsback message streams.
//used for performance profiling and debugging

const test = {};

test.db = window.indexedDB.open("recording", 3);


test.recording = false;
test.playbackIndex = -1;

//record a message nad timestamp
test.record = function (message) {
    if (test.recording) {
        test.buffer.push([Date.now() - test.last_time, Array.from(message)]);
        test.last_time = Date.now();
    }
}


test.startRecord = function () {
    test.recording = true;
    test.buffer = [];
    test.last_time = Date.now();
    test.playbackIndex = -1;
}


test.stop = function () {
    test.recording = false;
    test.playbackIndex = -1;
    window.localStorage.setItem("recording", JSON.stringify(test.buffer));
}

test.startPlayback = function () {
    test.buffer = JSON.parse(window.localStorage.getItem("recording"));
    test.recording = false;
    test.playbackIndex = 0;
    test.playback();
}

test.playback = function () {
    if (test.playbackIndex !== -1) {
        // console.log(test.playbackIndex);
        m.ws.send(new Uint8Array(test.buffer[test.playbackIndex][1]));
        if (test.playbackIndex === test.buffer.length-1)
            test.playbackIndex = -1;
        else {
            window.setTimeout(test.playback, test.buffer[test.playbackIndex][0])
            test.playbackIndex++;
        }

    }
}
