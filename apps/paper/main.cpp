#include "messages/messages.h"
#include "messages/register_handler.h"
#include "SharedSessionPaper.h"


int main(const int argc, const char *argv[]) {

    handlers[event::EventUnion_Echo] = [](auto msg_session, auto msg) {
        auto echo = msg->event_as_Echo();

        msg_serialized_type msg_serialized(200);


        // msg_serialized->Clear();
        msg_serialized.Finish(event::CreateMessage(
                msg_serialized,
                event::EventUnion_Echo,
                event::CreateEcho(
                        msg_serialized, 123, 123, msg_serialized.CreateString("payload2"))
                        .Union()));

        msg_session->enqueue(msg_serialized);
    };

    handlers[event::EventUnion_Join] = [](std::shared_ptr<MsgSession> &msg_session, msg_type msg) {
        auto join = msg->event_as_Join();

        msg_session->join(join->id()->str());

//    msg_session->join(SharedSessionPaper::get(join->id()->str()));
//    auto sp=SharedSessionPaper::get(join->id()->str());

//        std::string s("moi");
//        auto sp = std::make_shared<SharedSessionPaper>(s);
//    auto sp=std::make_shared<SharedSession>(s);
//        msg_session->join(sp);

//    msg_session->join();
//        msg_session->shared_session->test();


//    auto shared_paper= static_pointer_cast< SharedSessionPaper>(msg_session->shared_session);
//
//    shared_paper->paperding();



    };

    return (messagerunner(argc, argv));
}
