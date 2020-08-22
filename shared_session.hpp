#ifndef SHARED_SESSION_HPP
#define SHARED_SESSION_HPP

// #include <map>
// #include <mutex>
// #include <chrono>
// #include <string>
// #include <memory>
// #include <random>
// #include <cstdlib>
#include "msg_session.hpp"

// class MsgSession;

class SharedSession
{
public:
  SharedSession(void) {}

  ~SharedSession(void) {}

  // send to all sessions
  void enqueue(msg_serialized_type& msg_serialized)
  {

    std::unique_lock<std::mutex> lock(msg_sessions_lock);

    for (auto& msg_session : msg_sessions) {
      auto msg_session_shared = msg_session.lock();
      if (msg_session_shared != nullptr) {
        msg_session_shared->enqueue(msg_serialized);
      }
    }
  }

  //join a session
  void join(std::weak_ptr<MsgSession> new_msg_session)
  {
      //replace expired session?
    for (auto& msg_session : msg_sessions) {
        if (msg_session.expired())
        {
            msg_session=new_msg_session;
            return;
        }
    }

    msg_sessions.push_back(new_msg_session);

  }

private:
  std::mutex msg_sessions_lock;
  std::vector< std::weak_ptr<MsgSession> > msg_sessions;
};

#endif