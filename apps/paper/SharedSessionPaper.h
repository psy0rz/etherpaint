//
// Created by psy on 25-08-20.
//

#ifndef messages_SHAREDPAPER_H
#define messages_SHAREDPAPER_H


#include "messages/SharedSession.h"
#include <fstream>

class SharedSessionPaper : public SharedSession {
private:
    MsgBuilder msg_builder; //to send to clients
    MsgBuilder msg_builder_storage; //to send to storage module (without cursors and non-store increments)
    std::mutex msg_builder_mutex;

    std::fstream fs;

    void send_frame();

public:
    void join(std::shared_ptr<MsgSession> new_msg_session) override;


    static void update_thread();
    static void io_thread();

    inline static bool stop=false;

    explicit SharedSessionPaper(const std::string &id);

    void leave(std::shared_ptr<MsgSession> new_msg_session) override;

    void addDrawIncrement(const event::DrawIncrement* draw_increment);

    void check_done();

    void store();
//    void stream();

    void enqueue_live();
};


#endif //messages_SHAREDPAPER_H
