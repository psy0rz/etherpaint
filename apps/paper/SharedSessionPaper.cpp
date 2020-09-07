//
// Created by psy on 25-08-20.
//

#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"
#include <chrono>
#include "messages/program_error.hpp"

//shared session factory
std::shared_ptr<SharedSession> SharedSession::create(const std::string &id) {
    std::shared_ptr<SharedSession> shared_session = std::make_shared<SharedSessionPaper>(id);
    return (shared_session);
}

SharedSessionPaper::SharedSessionPaper(const std::string &id) : SharedSession(id), msg_builder(500) {


}

//global update thread for shared sessions
void SharedSessionPaper::update_thread() {

    const auto fps = 60;
    using frames = std::chrono::duration<int64_t, std::ratio<1, fps>>;

    auto start_time = std::chrono::system_clock::now();
    while (!stop) {
        std::this_thread::sleep_until(start_time + frames{1});
        start_time = std::chrono::system_clock::now();

        //locked
        {
            std::unique_lock<std::mutex> lock(SharedSession::shared_sessions_mutex);

            for (const auto &[id, shared_session]: SharedSession::shared_sessions) {
                auto shared_session_paper = std::static_pointer_cast<SharedSessionPaper>(shared_session);
                if (shared_session_paper != nullptr)
                    shared_session_paper->send_frame();
            }
        }
    }
}

//send an actual frame to all the connected sessions.
//called with fps by update_thread
void SharedSessionPaper::send_frame() {

    std::unique_lock<std::mutex> lock(msg_builder_mutex);

    {
        std::unique_lock<std::mutex> lock(msg_sessions_mutex);

        //add all the changed cursors
        for (auto &msg_session : msg_sessions) {
            auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

            if (msg_session_paper->cursor_changed) {
                msg_session_paper->cursor_changed = false;
                msg_builder.add_event(
                        event::EventUnion::EventUnion_Cursor,
                        msg_builder.builder.CreateStruct<event::Cursor>(msg_session_paper->cursor).Union()
                );
            }

        }
    }

    //only send if we have events
    if (!msg_builder.empty())
        enqueue(msg_builder);


}

void SharedSessionPaper::join(std::shared_ptr<MsgSession> new_msg_session) {
    //do insert it ourselfs and find new cid, so we only have to lock once
    std::unique_lock<std::mutex> lock(msg_sessions_mutex);

    auto new_msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(new_msg_session);

    //index all used ids
    std::bitset<256> used_ids; //uint8_t max
    for (const auto &msg_session: msg_sessions) {
        auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);
        used_ids.set(msg_session_paper->id);
    }

    //find first unused id (skip 0)
    for (uint8_t client_id = 1; client_id < 255; client_id++) {
        //found free id
        if (!used_ids[client_id]) {
            //set id and join
            new_msg_session_paper->id = client_id;
            msg_sessions.insert(new_msg_session_paper);
            DEB("Client joined as " << int(client_id) << " to shared control session " << this->id);

            //send join message back to client
            MsgBuilder mb(200);
            mb.add_event(event::EventUnion::EventUnion_Join,
                         event::CreateJoin(mb.builder, mb.builder.CreateString(this->id), client_id).Union());
            new_msg_session->enqueue(mb);
            return;

        }

    }

    throw (program_error("Max number of clients has been reached for this control"));


}

void SharedSessionPaper::leave(std::shared_ptr<MsgSession> new_msg_session) {
    SharedSession::leave(new_msg_session);


}
