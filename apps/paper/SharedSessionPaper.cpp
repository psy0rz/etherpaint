//
// Created by psy on 25-08-20.
//

#include "SharedSessionPaper.h"
#include <chrono>

//shared session factory
std::shared_ptr<SharedSession> SharedSession::create(const std::string &id) {
    std::shared_ptr<SharedSession> shared_session = std::make_shared<SharedSessionPaper>(id);
    return (shared_session);
}

SharedSessionPaper::SharedSessionPaper(const std::string &id) : SharedSession(id) {

    DEB("paper construct " << id);
//    current_frame=

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

            for ( const auto & [id, shared_session]: SharedSession::shared_sessions) {
                auto shared_session_paper = std::static_pointer_cast<SharedSessionPaper>(shared_session);
                if (shared_session_paper!=nullptr)
                    shared_session_paper->send_frame();
            }
        }
    }
}

//send an actual frame to all the connected sessions.
//called with fps by update_thread
void SharedSessionPaper::send_frame()
{
    INFO("send FRAME " << id );

}
