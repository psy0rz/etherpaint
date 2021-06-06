import Messages from "../messages.js";
import {event} from "../messages_generated";
import PaperSend from "../paperSend";

function send_drawincrement(messages, clientId, inctype, p1, p2, p3, store)
{
    messages.add_event(
        event.EventUnion.DrawIncrement,
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


function test_unjoined_send()
{

    let messages=new Messages(function()
        {
            send_drawincrement(messages, 0,0,0,0,0,0);
        });


    messages.expect(event.EventUnion.Error, (msg, eventIndex) => {
        const error = msg.events(eventIndex, new event.Error());
        console.log("TEST OK:", error.description());

    });

    messages.connect(false);

}

test_unjoined_send();



