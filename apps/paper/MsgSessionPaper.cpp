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


}
