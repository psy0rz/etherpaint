//
// Created by psy on 25-08-20.
//

#ifndef messages_SHAREDPAPER_H
#define messages_SHAREDPAPER_H


#include "messages/SharedSession.h"

class SharedSessionPaper : public SharedSession {
private:
    MsgBuilder msg_builder;

    void send_frame();


public:
    static void update_thread();
    inline static bool stop=false;

    explicit SharedSessionPaper(const std::string &id);




};


#endif //messages_SHAREDPAPER_H
