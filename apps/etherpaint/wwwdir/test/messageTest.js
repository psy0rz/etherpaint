import {event} from "../messages_generated";

class Expect
{
    constructor(messages, event_type, handler)
    {
        let self=this;

        this.stack=new Error().stack;
        this.failed=true;
        this.waiting=true; //still waiting for something

        messages.unknown_handler = (msg, event_index) => {

            if (!self.waiting) {
                console.error("Unexpected event:", event.EventUnionName[msg.eventsType(event_index)], self.stack);
                self.failed=true;
                return;
            }

            self.waiting=false;

            if (msg.eventsType(event_index) !== event_type) {
                console.error("Wrong event type received: ", event.EventUnionName[msg.eventsType(event_index)], self.stack);
                self.failed=true;
                return;
            }

            self.failed=false;
            handler(msg, event_index);

        }
    }

    result()
    {
        if (this.waiting)
        {
            console.error("FAILED (Still waiting)", this.stack);
        }
        // else if (this.failed)
        // {
        //     console.error("FAILED", this.stack);
        // }
        // else
        // {
        //     console.log("OK");
        // }
    }
}

export class MessageTest {

    constructor() {
        this.expects=[];
    }


    //expect a specific message, not more, not less
    expect(messages, event_type, handler) {
        this.expects.push(new Expect(messages, event_type, handler));
    }


    results()
    {
        for(let expect of this.expects)
        {
            expect.result();
        }
    }
}
