
#include "register_handler.h"


handler_type handlers[event::EventUnion_MAX + 1];

// Thanks to hkaiser@#boost for helping me with the automatic handler
// registration:
//register_handler::register_handler(enum event::EventUnion event, handler_type handler) {
//    if (handlers[event] != nullptr) {
//        std::stringstream msg;
//        msg << "Handler '" << event::EnumNameEventUnion(event) << "' nr=" << event << " already registered.";
//        throw (program_error(msg.str()));
//    }
//    handlers[event] = handler;
//    INFO("Registered handler " << event::EnumNameEventUnion(event));
//
//};


