
//just echo the message back
register_handler echo("echo", [](auto msg_session, auto msg) {
  msg_session->enqueue(msg);
});


