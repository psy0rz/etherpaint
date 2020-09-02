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

    struct {
        uint16_t x;
        uint16_t y;
    } cursor;



};


#endif //PAPER_MSGSESSIONPAPER_H
