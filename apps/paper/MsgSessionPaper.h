//
// Created by psy on 8/30/20.
//

#ifndef PAPER_MSGSESSIONPAPER_H
#define PAPER_MSGSESSIONPAPER_H
#include "messages/MsgSession.h"

class MsgSessionPaper:public MsgSession {
public:
    explicit MsgSessionPaper(uWS::WebSocket<ENABLE_SSL, true> *ws);


};


#endif //PAPER_MSGSESSIONPAPER_H
