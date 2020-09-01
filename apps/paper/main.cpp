#include "messages/messages.h"
#include "messages/register_handler.h"
#include "SharedSessionPaper.h"


int main(const int argc, const char *argv[]) {


    handlers[event::EventUnion_Join] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type & msg, auto event_index) {
        auto event = msg->events()->GetAs<event::Join>(event_index);

        INFO("Jooin " << event->id()->str());
        msg_session->join(event->id()->str());
    };


    handlers[event::EventUnion_Cursor] = [](const std::shared_ptr<MsgSession> &msg_session, const msg_type & msg, auto event_index) {
        auto event = msg->events()->GetAs<event::Cursor>(event_index);

        INFO("cursor " << event->x() << "," << event->y());
    };


    return (messagerunner(argc, argv));
}
