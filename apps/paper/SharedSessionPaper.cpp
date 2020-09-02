//
// Created by psy on 25-08-20.
//

#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"
#include <chrono>

//shared session factory
std::shared_ptr<SharedSession> SharedSession::create(const std::string &id) {
    std::shared_ptr<SharedSession> shared_session = std::make_shared<SharedSessionPaper>(id);
    return (shared_session);
}

SharedSessionPaper::SharedSessionPaper(const std::string &id) : SharedSession(id), msg_builder(500) {

    DEB("paper construct " << id);

}

//global update thread for shared sessions
void SharedSessionPaper::update_thread() {

    const auto fps = 1;
    using frames = std::chrono::duration<int64_t, std::ratio<1, fps>>;

    auto start_time = std::chrono::system_clock::now();
    while (!stop) {
        std::this_thread::sleep_until(start_time + frames{1});
        start_time = std::chrono::system_clock::now();

        //locked
        {
            std::unique_lock<std::mutex> lock(SharedSession::shared_sessions_lock);

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
    INFO("send FRAME " << id);

    std::unique_lock<std::mutex> lock(msg_sessions_lock);

    //add all the cursors
    for (auto &msg_session : msg_sessions) {
        auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

        msg_builder.add_event(
                event::EventUnion::EventUnion_Cursor,
                msg_builder.builder.CreateStruct<event::Cursor>(msg_session_paper->cursor).Union()
        );

    }



}
