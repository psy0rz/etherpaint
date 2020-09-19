//
// Created by psy on 25-08-20.
//

#ifndef messages_SHAREDPAPER_H
#define messages_SHAREDPAPER_H


#include "messages/SharedSession.h"

class SharedSessionPaper : public SharedSession {
private:
    MsgBuilder msg_builder; //to send to clients
    MsgBuilder msg_builder_storage; //to send to storage module (without cursors and non-store increments)
    std::mutex msg_builder_mutex;


    void send_frame();

public:
    void join(std::shared_ptr<MsgSession> new_msg_session) override;


public:
    static void update_thread();
    inline static bool stop=false;

    explicit SharedSessionPaper(const std::string &id);

    void leave(std::shared_ptr<MsgSession> new_msg_session) override;

    void addDrawIncrement(const event::DrawIncrement* draw_increment);

    void store();
//    void stream();
};


#endif //messages_SHAREDPAPER_H
