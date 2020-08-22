#include "messages_generated.h"
#include "shared_session.hpp"

register_handler echo(event::EventUnion_Echo, [](auto msg_session, auto msg) {

  auto echo=msg->event_as_Echo();


  msg_serialized_type msg_serialized(200);

  // msg_serialized->Clear();
  msg_serialized.Finish(event::CreateMessage(
    msg_serialized,
    event::EventUnion_Echo,
    event::CreateEcho(
      msg_serialized, 123, 123, msg_serialized.CreateString("payload2"))
      .Union(),
    1111));

  msg_session->enqueue(msg_serialized);

});

