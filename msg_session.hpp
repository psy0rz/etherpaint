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
// #include "shared_session.hpp"

#include "messages_generated.h"

class SharedSession;



// NOTE: uwebsockets can only be used from the correct thread. so be carefull
// and defer stuff to websocket thread when needed.

class MsgSession : public std::enable_shared_from_this<MsgSession>
{
private:
  uWS::WebSocket<ENABLE_SSL, true>* ws;
  uWS::Loop* loop;
  std::deque<msg_serialized_type> msg_queue;
  std::mutex msg_queue_mutex;
  std::shared_ptr<SharedSession> shared_session;

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
  ~MsgSession()
  {
    // DEB("Closed msg session");
    ;
  }

  // send queued messages until backpressure has build up.
  // when backpressure is down/changed this will be called again.
  //(called from ws thread)
  void send_queue()
  {
    std::lock_guard<std::mutex> lock(msg_queue_mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
      return;

    // int before = msg_queue.size();
    ws->cork([this]() {
      while (!msg_queue.empty() && !ws->getBufferedAmount()) {
        static int i = 0;
        i++;
        // DEB("send " << i << " q=" << msg_queue.size());
        auto& msg_serialized = msg_queue.back();

        std::string_view msg_view(
          reinterpret_cast<char*>(msg_serialized.GetBufferPointer()),
          msg_serialized.GetSize());

        auto ok = ws->send(msg_view, uWS::BINARY, true);

        // check

        // auto message = event::GetMessage(msg_serialized.GetBufferPointer());
        // auto event_type=message->event_type();
        // DEB("SEND EVENT TYPE" << event_type);
        // auto kut=message->kut();
        // DEB("SEND kut" << kut);

        msg_queue.pop_back(); // destroys flatbuffer

        if (!ok)
          break;
      }
    });
    if (msg_queue.size() != 0) {
      DEB("got backpresure, messages left in queue: " << msg_queue.size());
    }
  }

  // enqueue message for this websocket, will inform websocket thread to start
  // sending if it isn't already.
  // (called from any thread)
  void enqueue(msg_serialized_type& msg_serialized)
  {
    std::lock_guard<std::mutex> lock(msg_queue_mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
      return;

    // if queue was empty, ws will never call send_queue(), so make it call it
    if (msg_queue.empty()) {
      // notify websocket thread to start sending
      // auto msg_session(shared_from_this());
      loop->defer(
        [msg_session = shared_from_this()]() { msg_session->send_queue(); });
    }

    msg_queue.push_front(std::move(msg_serialized));
  }

  // send error message
  void enqueue_error(const std::string& description)
  {

    msg_serialized_type msg_serialized(200);
    msg_serialized.Finish(event::CreateMessage(
      msg_serialized,
      event::EventUnion_Error,
      event::CreateError(
        msg_serialized,
        msg_serialized.CreateString(description))
        .Union()));

    enqueue(msg_serialized);
  }
};
#endif
