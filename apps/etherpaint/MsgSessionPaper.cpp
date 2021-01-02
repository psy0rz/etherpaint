//
// Created by psy on 8/30/20.
//

#include "MsgSessionPaper.h"
#include "SharedSessionPaper.h"

//message session factory
std::shared_ptr<MsgSession> MsgSession::create(uWS::WebSocket<ENABLE_SSL, true> *ws) {
    std::shared_ptr<MsgSession> msg_session = std::make_shared<MsgSessionPaper>(ws);
    return (msg_session);
}

MsgSessionPaper::MsgSessionPaper(uWS::WebSocket<false, true> *ws) : MsgSession(ws) {


}

void MsgSessionPaper::join(std::shared_ptr<SharedSession> shared_session) {
    MsgSession::join(shared_session);
    //request sync
    SharedSessionPaper::request_data(std::static_pointer_cast<MsgSessionPaper>(shared_from_this()));

}

//new sync starting
void MsgSessionPaper::streamStart(std::string &paper_id, uint8_t client_id) {

    streaming = true;
    streaming_offset = 0;
    this->id = client_id;

    MsgBuilder mb(200);
    mb.add_event(event::EventUnion::EventUnion_StreamStart,
                 event::CreateStreamStart(mb.builder, mb.builder.CreateString(paper_id)).Union());
    enqueue(mb);
}

//called when sync complete
void MsgSessionPaper::streamSynced() {

    streaming = false;

    MsgBuilder mb(200);
    mb.add_event(event::EventUnion::EventUnion_StreamSynced,
                 event::CreateStreamSynced(mb.builder, this->id).Union());
    enqueue(mb);
}




void MsgSessionPaper::queue_low() {
    if (streaming) {
//ERROR("low");
        SharedSessionPaper::request_data(std::static_pointer_cast<MsgSessionPaper>(shared_from_this()));
    }

}
