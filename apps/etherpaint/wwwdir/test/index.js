import Messages from "../messages.js";
import {event} from "../messages_generated";
import {MessageTest} from "./messageTest";
import PaperSend from "../paperSend";

let message_test=new MessageTest();


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

////////////////send command while not joined
{
    let messages=new Messages(function()
    {
        messages.add_event(
            event.EventUnion.DrawIncrement,
            event.DrawIncrement.createDrawIncrement(
                messages.builder,
                1, 0,0,0,0,0
            )
        );

        messages.send();
    });
    message_test.expect(messages, event.EventUnion.Error, (msg, eventIndex) => {
        const error = msg.events(eventIndex, new event.Error());
        if (error.description().indexOf("Client doesn't have an ID")===-1)
            console.error("Wrong error: ", error.description())

    });
    messages.connect(false);
}

////////////////wrong client id, after joining
{
    let messages=new Messages(function()
    {
        let paperSend = new PaperSend(messages);
        paperSend.join("empty");
        messages.send();
    });
    message_test.expect(messages, event.EventUnion.StreamStart, (msg, eventIndex) => {
        message_test.expect(messages, event.EventUnion.StreamSynced, (msg, eventIndex) => {
            message_test.expect(messages, event.EventUnion.ClientJoined, (msg, eventIndex) => {
                message_test.expect(messages, event.EventUnion.Error, (msg, eventIndex) => {
                    const error = msg.events(eventIndex, new event.Error());
                    if (error.description().indexOf("invalid client id")===-1)
                        console.error("Wrong error: ", error.description())

                });
                messages.add_event(
                    event.EventUnion.DrawIncrement,
                    event.DrawIncrement.createDrawIncrement(
                        messages.builder,
                        2, 0,0,0,0,0
                ));
                messages.send();

            });
        });
    });
    messages.connect(false);
}


////////////////exaust client ids

////////////////send after exausting


//wait for tests to complete
setTimeout(function()
{
    message_test.results();
    console.log("Done");

}, 1000);


