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


    event::Cursor cursor;
    bool cursor_changed=false;
    uint8_t id=0; //client id
    bool live=true;
//    uint32_t stream_offset



};


#endif //PAPER_MSGSESSIONPAPER_H
