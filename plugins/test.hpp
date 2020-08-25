#include "messages_generated.h"
#include "shared_session.h"
#include "msg_session.h"
#include "handler_manager.hpp"

register_handler echo(event::EventUnion_Echo, [](auto msg_session, auto msg) {
    auto echo = msg->event_as_Echo();

    msg_serialized_type msg_serialized(200);

    // msg_serialized->Clear();
    msg_serialized.Finish(event::CreateMessage(
            msg_serialized,
            event::EventUnion_Echo,
            event::CreateEcho(
                    msg_serialized, 123, 123, msg_serialized.CreateString("payload2"))
                    .Union()));

    msg_session->enqueue(msg_serialized);
});

register_handler join(event::EventUnion_Join, [](auto msg_session, auto msg) {
    auto join = msg->event_as_Join();
//    DEB("Joining " << join->id()->str());
    msg_session->join(SharedSession::get(join->id()->str()));

//    msg_session->join();
    msg_session->shared_session->test();


});
