#ifndef HANDLER_MANAGER_HPP
#define HANDLER_MANAGER_HPP

#include "msg.hpp"
#include "program_error.hpp"
#include "msg_session.h"

#include <functional>
#include <iostream>
#include <sstream>
#include <unordered_map>


// implementation specific. we use uwebsocket + flatbuffers for now
#include <WebSocket.h>
#include "messages_generated.h"

typedef std::function<void(std::shared_ptr<MsgSession> & msg_session,
                           msg_type msg)>
  handler_type;

handler_type handlers[event::EventUnion_MAX+1];

// Thanks to hkaiser@#boost for helping me with the automatic handler
// registration:
struct register_handler
{
  register_handler(enum event::EventUnion event, handler_type handler)
  {
    if (handlers[event]!=nullptr) {
      std::stringstream msg;
      msg << "Handler '" << event::EnumNameEventUnion(event) << "' nr=" << event << " already registered.";
      throw(program_error(msg.str()));
    }
    handlers[event] = handler;
    INFO("Registered handler " <<  event::EnumNameEventUnion(event));
  };
};


#endif