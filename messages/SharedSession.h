#ifndef SHARED_SESSION_HPP
#define SHARED_SESSION_HPP

// #include <map>
// #include <mutex>
// #include <chrono>
// #include <string>
// #include <memory>
// #include <random>
// #include <cstdlib>
#include "MsgSession.h"

class MsgSession;

class SharedSession {
private:
    // all the shared sessions (static/global)
    inline static std::mutex shared_sessions_lock;
    inline static std::map<std::string, std::weak_ptr<SharedSession>> shared_sessions;

    std::string id;

    // sessions that are joined to this shared session
    std::mutex msg_sessions_lock;
    std::vector<std::weak_ptr<MsgSession>> msg_sessions;

public:
    //NOTE: implement this yourself, so you can return a subclass if needed. link-time implementation.
    static std::shared_ptr<SharedSession> create(const std::string & id);


    SharedSession(const std::string &id);

    ~SharedSession(void) {DEB("Destroyed shared session " << id); }

    // get/create a shared session by id-string
    static std::shared_ptr<SharedSession> get(const std::string &id);

    // send to all sessions
    void enqueue(msg_serialized_type &msg_serialized);

    // let a session join this shared_session
    void join(std::weak_ptr<MsgSession> new_msg_session);

    virtual void test();
};

#endif