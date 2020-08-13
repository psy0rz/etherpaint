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

// rapidjson
#include "rapidjson/stringbuffer.h"

// NOTE: uwebsockets can only be used from the correct thread. so be carefull
// and defer stuff to websocket thread when needed.

class MsgSession : public std::enable_shared_from_this<MsgSession>
{
private:
  uWS::WebSocket<ENABLE_SSL, true>* ws;
  uWS::Loop* loop;
  std::deque<std::shared_ptr<msg_type>> msg_queue;
  std::mutex msg_queue_mutex;

public:
  // std::shared_ptr<MsgSession> getptr() {
  //       return shared_from_this();
  //   }
  // called when ws is closed.
  // the session might be referenced to for a while by other threads or and
  // objects.
  // (called from ws thread)
  void closed()
  {
    std::lock_guard<std::mutex> lock(msg_queue_mutex);
    ws = nullptr;
  }

  // (called from ws thread)
  MsgSession(uWS::WebSocket<ENABLE_SSL, true>* ws)
  {
    this->ws = ws;
    // uwebsocket is single threaded, but supports deffering from other threads
    // Store loop for the current thread. (the one thats belongs to this ws)
    this->loop = uWS::Loop::get();

    // DEB("Created new msg session");
  }

  // called from any thread (whoever releases the last smart_ptr)
  ~MsgSession() { 
    // DEB("Closed msg session"); 
    ;
    }

  // serialize and send all queued messages until backpressure has build up.
  // when backpressure is down/changed this will be called again.
  //(called from ws thread)
  void send_queue()
  {
    std::lock_guard<std::mutex> lock(msg_queue_mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
      return;

    ws->cork([this]() {
      while (!msg_queue.empty() && !ws->getBufferedAmount()) {
        auto msg = msg_queue.back();
        msg_queue.pop_back();

        rapidjson::StringBuffer serialized_msg;
        rapidjson::Writer<rapidjson::StringBuffer> writer(serialized_msg);
        msg->Accept(writer);

        if (!ws->send(serialized_msg.GetString(), uWS::TEXT, false))
          return;
      }
    });
  }

  // enqueue message for this websocket, will inform websocket thread to start
  // sending if it isn't already.
  // (called from any thread)
  void enqueue(std::shared_ptr<msg_type> msg)
  {
    std::lock_guard<std::mutex> lock(msg_queue_mutex);

    // if queue was empty, ws will never call send_queue(), so make it call it
    if (msg_queue.empty()) {
      // notify websocket thread to start sending
      // auto msg_session(shared_from_this());
      loop->defer(
        [msg_session = shared_from_this()]() { msg_session->send_queue(); });
    }

    msg_queue.push_front(msg);
  }

  void enqueue_error(std::string error)
  {
    auto msg = new_event("error");

    (*msg)["pars"].AddMember("description", error, msg->GetAllocator());

    enqueue(msg);
  }
};

#endif
