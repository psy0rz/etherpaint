// class test
// {
//   public:
//   test()
//   {
//     ERROR("che");

//     std::thread([]() {

//   }

// } testi;

// std::shared_ptr<MsgSession> lastsess;
// just echo the message back
// register_handler echo("echo", [](auto msg_session, auto msg) {
//   DEB("ECH");
//   lastsess=msg_session;
//   // msg_session->enqueue(msg);
// });

register_handler echo(event::EventUnion_Echo, [](auto msg_session, auto msg) {
  DEB("ECHoooo");

  auto echo = static_cast<const event::Echo*>(msg->event());

  DEB("ontvangen " << echo->payload()->str() << " en kut " << msg->kut());

  // msg_session->enqueue(msg);
  // static flatbuffers::FlatBufferBuilder builder(1024);
  // auto new_msg=std::make_shared<msg_serialized_type>(200);
  msg_serialized_type msg_serialized(200);

  // msg_serialized->Clear();
  msg_serialized.Finish(event::CreateMessage(
    msg_serialized,
    event::EventUnion_Echo,
    event::CreateEcho(
      msg_serialized, 123, 123, msg_serialized.CreateString("payload2"))
      .Union(),
    1111));


  DEB("enq")

  msg_session->enqueue(msg_serialized);

  // builder.Finish()
  //             builder.finish(
  //               event:: Message.CreateMessage(
  //                   builder,
  //                   event.Event.Echo,
  //                   event.Echo.createEcho(
  //                       builder,
  //                       id,
  //                       456,
  //                       builder.createString("payloadddd")
  //                   )
  //               )
  //           );
  //           ws.send(builder.asUint8Array());
});
