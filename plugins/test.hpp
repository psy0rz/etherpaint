
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
//just echo the message back
// register_handler echo("echo", [](auto msg_session, auto msg) {
//   DEB("ECH");
//   lastsess=msg_session;
//   // msg_session->enqueue(msg);
// });

register_handler echo(event::Event_Echo, [](auto msg_session, auto msg) {
  DEB("ECHoooo");
  // msg_session->enqueue(msg);
});

