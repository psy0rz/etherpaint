import Messages from "../messages.js";
import {event} from "../messages_generated";
import {MessageTest} from "./messageTest";

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

////////////////wrong client id


////////////////exaust client ids

////////////////send after exausting


//wait for tests to complete
setTimeout(function()
{
    message_test.results();
    console.log("Done");

}, 1000);


