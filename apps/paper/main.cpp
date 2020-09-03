#include <messages/program_error.hpp>
#include "messages/messages.h"
#include "messages/register_handler.h"
#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"
#include "messages/program_error.hpp"


int main(const int argc, const char *argv[]) {


    handlers[event::EventUnion_Join] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                          auto event_index) {
        auto event = msg->events()->GetAs<event::Join>(event_index);

        msg_session->join(event->id()->str());


    };


    handlers[event::EventUnion_Cursor] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                            auto event_index) {
        const auto &msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

        auto cursor = msg->events()->GetAs<event::Cursor>(event_index);
        if (cursor->client_id()!=msg_session_paper->id)
            throw (program_error("Invalid client id"));

        //not thread safe but shouldnt matter for cursors?
        msg_session_paper->cursor = *cursor;
        msg_session_paper->cursor_changed = true;

//        INFO("cursor " << cursor->x() << "," << cursor->y());

    };

    std::thread update_thread(SharedSessionPaper::update_thread);

    messagerunner(argc, argv);
    update_thread.join();


}
