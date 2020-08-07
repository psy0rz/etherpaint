
// Thanks to hkaiser@#boost for helping me with the automatic handler
// registration:

#include "program_error.hpp"
#include <functional>
#include <iostream>
#include <map>
#include <sstream>

typedef std::function<void(double, double)> handler_type;
std::map<const char*, handler_type> handlers;
struct register_handler
{
  register_handler(char const* name, handler_type handler)
  {
    if (handlers.find(name) != handlers.end()) {
      stringstream msg;
	  msg << "Handler '" << name << "' already registered.";
      throw(program_error(msg.str()));
    }
    handlers[name] = handler;
  }
};

register_handler kut("kut", [](double a, double b) {
  cout << "kut\n\n";
  return;
});

register_handler poep("poep", [](double a, double b) {
  cout << "poep\n\n";
  return;
});
