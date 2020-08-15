#ifndef HANDLER_MANAGER_HPP
#define HANDLER_MANAGER_HPP

#include "msg.hpp"
#include "program_error.hpp"
#include "msg_session.hpp"

#include <functional>
#include <iostream>
#include <sstream>
#include <unordered_map>


// implementation specific. we use uwebsocket + flatbuffers for now
#include <WebSocket.h>
#include "messages_generated.h"

typedef std::function<void(std::shared_ptr<MsgSession> & msg_session,
                           const event::Message * message)>
  handler_type;

handler_type handlers[event::Event_MAX];

// Thanks to hkaiser@#boost for helping me with the automatic handler
// registration:
struct register_handler
{
  register_handler(enum event::Event event, handler_type handler)
  {
    // if (handlers.find(name) != handlers.end()) {
    //   std::stringstream msg;
    //   msg << "Handler '" << name << "' already registered.";
    //   throw(program_error(msg.str()));
    // }
    handlers[event] = handler;
    INFO("Registered handler " << event);
  };
};


#endif