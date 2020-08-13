#ifndef HANDLER_MANAGER_HPP
#define HANDLER_MANAGER_HPP

#include "msg.hpp"
#include "program_error.hpp"
#include "msg_session.hpp"

#include <functional>
#include <iostream>
#include <sstream>
#include <unordered_map>


// implementation specific. we use uwebsocket + rapidjson for now
#include <WebSocket.h>

typedef std::function<void(std::shared_ptr<MsgSession> & msg_session,
                           std::shared_ptr<msg_type> & document)>
  handler_type;

std::unordered_map<std::string, handler_type> handlers;

// Thanks to hkaiser@#boost for helping me with the automatic handler
// registration:
struct register_handler
{
  register_handler(char const* name, handler_type handler)
  {
    if (handlers.find(name) != handlers.end()) {
      std::stringstream msg;
      msg << "Handler '" << name << "' already registered.";
      throw(program_error(msg.str()));
    }
    handlers[name] = handler;
    INFO("Registered handler " << name);
    if (handlers.find(name) == handlers.end()) {
      ERROR("WTF");
    }
  };
};


#endif