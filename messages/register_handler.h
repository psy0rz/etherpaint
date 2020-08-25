#ifndef REGISTER_HANDER_H
#define REGISTER_HANDER_H

#include "msg.hpp"
//#include "program_error.hpp"
#include "MsgSession.h"

//#include <functional>
//#include <iostream>
//#include <sstream>
//#include <unordered_map>


// implementation specific. we use uwebsocket + flatbuffers for now
//#include <WebSocket.h>
//#include "messages_generated.h"

typedef std::function<void(std::shared_ptr<MsgSession> &msg_session,
                           msg_type msg)>
        handler_type;

extern handler_type handlers[event::EventUnion_MAX + 1];

//// Thanks to hkaiser@#boost for helping me with the automatic handler
//// registration:
//struct register_handler {
//    register_handler(enum event::EventUnion event, handler_type handler);
//};


#endif