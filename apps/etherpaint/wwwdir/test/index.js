import Messages from "../messages.js";
import {event} from "../messages_generated";
import {MessageTest} from "./messageTest";

let message_test=new MessageTest();

function send_drawincrement(messages, clientId, inctype, p1, p2, p3, store)
{
    messages.add_event(
        event.EventUnion.DrawObject,
        event.DrawIncrement.createDrawIncrement(
            messages.builder,
            clientId,
            inctype,
            p1,
            p2,
            p3,
            store
        ));

    messages.send();
}

/////////////test invalid event type
{
    let messages=new Messages(function()
    {
        messages.add_event(-1,0);
        messages.send();
    });
    message_test.expect(messages,event.EventUnion.Error, (msg, eventIndex) => {
        const error = msg.events(eventIndex, new event.Error());
        if (error.description().indexOf("Invalid event type")===-1)
            console.error("Wrong error: ", error.description())
    });
    messages.connect(false);
}

//////////////corrupt buffer
{
    let messages=new Messages(function()
    {
        messages.add_event(1,0);
        messages.send();
    });
    message_test.expect(messages,event.EventUnion.Error, (msg, eventIndex) => {
        const error = msg.events(eventIndex, new event.Error());
        if (error.description().indexOf("Corrupt")===-1)
            console.error("Wrong error: ", error.description())

    });
    messages.connect(false);
}

////////////////send commands while not joined yet
{
    let messages=new Messages(function()
    {
        send_drawincrement(messages, 0,0,0,0,0,0);
    });
    message_test.expect(messages, event.EventUnion.Error, (msg, eventIndex) => {
        const error = msg.events(eventIndex, new event.Error());
        if (error.description().indexOf("joined")===-1)
            console.error("Wrong error: ", error.description())

    });
    messages.connect(false);
}


//wait for tests to complete
setTimeout(function()
{
    message_test.results();
    console.log("Done");

}, 1000);


