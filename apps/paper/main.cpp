#include <messages/program_error.hpp>
#include "messages/messages.h"
#include "messages/register_handler.h"
#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"
#include "messages/program_error.hpp"

/*

 begin color 0,0,0

 lijn tekenen:               inverse versie:
 change color +20            unchange color -20
 change tool to poly (+3)    unchange tool (-3)
 add point 1,1               remove point 1,1
 aad point 10,10             remove point 10,10

absolute color: 20

lijn deleten met color 30
delete is an inverted draw.
                                         inverse (tekend de lijn weer)
change color +10                         change color -10
remove point 6,0                         add point 6,0
remove point 3,3                         add point 3,3
change color -10                         change color +10

 absolute color 20


 */

int main(const int argc, const char *argv[]) {

    //Join
    handlers[event::EventUnion_Join] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                          auto event_index) {
        auto event = msg->events()->GetAs<event::Join>(event_index);

        msg_session->join(event->id()->str());


    };

    //Cursor update
    handlers[event::EventUnion_Cursor] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                            auto event_index) {
        const auto &msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

        auto cursor = msg->events()->GetAs<event::Cursor>(event_index);
        if (cursor->client_id() != msg_session_paper->id)
            throw (program_error("Invalid client id"));

        //not thread safe but shouldnt matter for cursors?
        msg_session_paper->cursor = *cursor;
        msg_session_paper->cursor_changed = true;

    };

    //Incremental draw
    handlers[event::EventUnion_DrawIncrement] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                                   auto event_index) {
        const auto &msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);
        const auto &shared_session_paper = std::static_pointer_cast<SharedSessionPaper>(msg_session_paper->shared_session);

        const auto draw_increment = msg->events()->GetAs<event::DrawIncrement>(event_index);
        if (draw_increment->client_id() != msg_session_paper->id)
            throw (program_error("Invalid client id"));

        shared_session_paper->addDrawIncrement(draw_increment);

    };

    std::thread update_thread(SharedSessionPaper::update_thread);

    messagerunner(argc, argv);
    update_thread.join();

}



