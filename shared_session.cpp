#include "shared_session.h"

SharedSession::SharedSession(const std::string &id) {
    this->id = id;
    DEB("Created shared session " << id);
}

std::shared_ptr<SharedSession> SharedSession::get(const std::string &id) {
    std::unique_lock<std::mutex> lock(SharedSession::shared_sessions_lock);
    auto existing_shared_session = SharedSession::shared_sessions.find(id);

    // session doesnt exist (anymore)?
    if (existing_shared_session == SharedSession::shared_sessions.end() ||
        existing_shared_session->second.expired()) {
        // create new shared session
        auto new_shared_session = std::make_shared<SharedSession>(id);
        SharedSession::shared_sessions[id] = new_shared_session;
        return (new_shared_session);

    } else {
        // return existing
        return (SharedSession::shared_sessions[id].lock());
    }
}

void SharedSession::enqueue(msg_serialized_type &msg_serialized) {

    std::unique_lock<std::mutex> lock(msg_sessions_lock);

    for (auto &msg_session : msg_sessions) {
        auto msg_session_shared = msg_session.lock();
        if (msg_session_shared != nullptr) {
            msg_session_shared->enqueue(msg_serialized);
        }
    }
}

void SharedSession::join(std::weak_ptr<MsgSession> new_msg_session) {
    std::unique_lock<std::mutex> lock(msg_sessions_lock);

    // replace an expired session?
    for (auto &msg_session : msg_sessions) {
        if (msg_session.expired()) {
            msg_session = new_msg_session;
            return;
        }
    }

    msg_sessions.push_back(new_msg_session);
}

