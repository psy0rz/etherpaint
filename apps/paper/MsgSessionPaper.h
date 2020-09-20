//
// Created by psy on 8/30/20.
//

#ifndef PAPER_MSGSESSIONPAPER_H
#define PAPER_MSGSESSIONPAPER_H
#include "messages/MsgSession.h"
#include "messages_generated.h"


class MsgSessionPaper:public MsgSession {
public:
    explicit MsgSessionPaper(uWS::WebSocket<ENABLE_SSL, true> *ws);

    void join(std::shared_ptr<SharedSession> shared_session) override;

    event::Cursor cursor;
    bool cursor_changed=false;
    uint8_t id=0; //client id

    //controlled by SharedSessionPaper::
    bool streaming=true;
    flatbuffers::uoffset_t streaming_offset=0;



};


#endif //PAPER_MSGSESSIONPAPER_H
