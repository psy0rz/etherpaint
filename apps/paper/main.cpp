#include "messages/messages.h"
#include "messages/register_handler.h"
#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"


int main(const int argc, const char *argv[]) {


    handlers[event::EventUnion_Join] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                          auto event_index) {
        auto event = msg->events()->GetAs<event::Join>(event_index);

        INFO("Jooin " << event->id()->str());
        msg_session->join(event->id()->str());
    };


    handlers[event::EventUnion_Cursor] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type &msg,
                                            auto event_index) {
        const auto & event = msg->events()->GetAs<event::Cursor>(event_index);
        const auto & msg_session_paper= std::static_pointer_cast<MsgSessionPaper>(msg_session);

        msg_session_paper->cursor.x=event->x();
        msg_session_paper->cursor.y=event->y();

//        INFO("cursor " << event->x() << "," << event->y());

    };

    std::thread update_thread(SharedSessionPaper::update_thread);

    messagerunner(argc, argv);
    update_thread.join();


}
