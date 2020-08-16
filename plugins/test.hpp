// class test
// {
//   public:
//   test()
//   {
//     ERROR("che");

//     std::thread([]() {

//   }

// } testi;

std::shared_ptr<MsgSession> lastsess;
// just echo the message back
// register_handler echo("echo", [](auto msg_session, auto msg) {
//   DEB("ECH");
//   lastsess=msg_session;
//   // msg_session->enqueue(msg);
// });

register_handler echo(event::Event_Echo, [](auto msg_session, auto msg) {
  DEB("ECHoooo");
  // msg_session->enqueue(msg);
  static flatbuffers::FlatBufferBuilder builder(1024);
  builder.Clear();
  builder.Finish(event::CreateMessage(
    builder,
    event::Event::Event_Echo,
    event::CreateEcho(builder, 123, 123, builder.CreateString("payload2"))
      .Union()));

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
