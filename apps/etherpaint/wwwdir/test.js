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
        test.buffer.push([Date.now() - test.last_time, message]);
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
        window.setTimeout(test.playback, test.buffer[test.playbackIndex][0])
        const m = test.buffer[test.playbackIndex][1];
        if (m.length === 2)
            paper.sendCursor(m[0], m[1]);
        else
            paper.sendDrawIncrement(m[0], m[1], m[2], m[3]);
        if (test.playbackIndex === test.buffer.length - 1) {
            //loop
            test.playbackIndex = 0;
        } else {
            test.playbackIndex++;
        }

    }
}
