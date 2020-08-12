

#ifndef HANDLER_MANAGER_HPP
#define HANDLER_MANAGER_HPP

#include "program_error.hpp"
#include "msg.hpp"

#include <functional>
#include <iostream>
#include <map>
#include <sstream>


// implementation specific. we use uwebsocket + rapidjson for now
#include <WebSocket.h>

typedef std::function<void(uWS::WebSocket<ENABLE_SSL, true>* ws,
                           std::shared_ptr<msg_type> document)>
  handler_type;

std::map<const char*, handler_type> handlers;

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
  }
};

register_handler kut("kut", [](auto * a, auto b) {
  
  return;
});

#endif