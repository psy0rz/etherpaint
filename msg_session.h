#ifndef MSG_SESSION_HPP
#define MSG_SESSION_HPP

#include "log.hpp"
#include <cstdlib>
#include <deque>
#include <map>
#include <memory>
#include <mutex>
#include <random>
#include <string>

// uwebsockets
#include <Loop.h>
#include <WebSocket.h>

#include "msg.hpp"
#include "shared_session.h"

#include "messages_generated.h"
#include "config.h"

class SharedSession;

// NOTE: uwebsockets can only be used from the correct thread. so be carefull
// and defer stuff to websocket thread when needed.

class MsgSession : public std::enable_shared_from_this<MsgSession> {
private:
    uWS::WebSocket<ENABLE_SSL, true> *ws;
    uWS::Loop *loop;
    std::deque<msg_serialized_type> msg_queue;
    std::mutex msg_queue_mutex;

    // the session we have currently joined (if any)
    std::shared_ptr<SharedSession> shared_session;

public:
    // join a shared session
    void join(std::shared_ptr<SharedSession> shared_session);

    // called when ws is closed.
    // the session might be referenced to for a while by other threads or and
    // objects.
    // (called from ws thread)
    void closed();

    // (called from ws thread)
    MsgSession(uWS::WebSocket<ENABLE_SSL, true> *ws);

    // called from any thread (whoever releases the last smart_ptr)
    ~MsgSession();

    // send queued messages until backpressure has build up.
    // when backpressure is down/changed this will be called again.
    //(called from ws thread)
    void send_queue();

    // enqueue message for this websocket, will inform websocket thread to start
    // sending if it isn't already.
    // (called from any thread)
    void enqueue(msg_serialized_type &msg_serialized);

    // send error message
    void enqueue_error(const std::string &description);
};


#endif
