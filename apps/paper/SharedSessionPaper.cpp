//
// Created by psy on 25-08-20.
//

#include "SharedSessionPaper.h"
#include "MsgSessionPaper.h"
#include <chrono>
#include "messages/program_error.hpp"
//#include "msg.hpp"

//shared session factory
std::shared_ptr<SharedSession> SharedSession::create(const std::string &id) {
    std::shared_ptr<SharedSession> shared_session = std::make_shared<SharedSessionPaper>(id);
    return (shared_session);
}

SharedSessionPaper::SharedSessionPaper(const std::string &id) :
        SharedSession(id),
        msg_builder(500),
        msg_builder_storage(500) {


    fs.exceptions(std::ios::failbit | std::ios::badbit);
    fs.open(id + ".paper", std::ios::in | std::ios::out | std::ios::binary | std::ios::app);

}

//STATIC global update thread for shared sessions
void SharedSessionPaper::update_thread() {

    const auto fps = 60;
    using frames = std::chrono::duration<int64_t, std::ratio<1, fps>>;

    auto start_time = std::chrono::system_clock::now();
    while (!stop) {
        std::this_thread::sleep_until(start_time + frames{1});
        start_time = std::chrono::system_clock::now();

        //locked
        {
            std::unique_lock<std::mutex> lock(SharedSession::shared_sessions_mutex);

            for (const auto &[id, shared_session_weak]: SharedSession::shared_sessions) {
                auto shared_session = shared_session_weak.lock();
                if (shared_session != nullptr) {
                    auto shared_session_paper = std::static_pointer_cast<SharedSessionPaper>(shared_session);
                    if (shared_session_paper != nullptr)
                        shared_session_paper->send_frame();
                }
            }
        }
    }
}


//send an actual frame to all the connected sessions that are live
//called with fps by update_thread
void SharedSessionPaper::send_frame() {


    std::unique_lock<std::mutex> lock_sessions(msg_sessions_mutex);
    std::unique_lock<std::mutex> lock_builder(msg_builder_mutex);

    //add all the changed cursors
    for (auto &msg_session : msg_sessions) {
        auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

        if (msg_session_paper->cursor_changed) {
            msg_session_paper->cursor_changed = false;
            msg_builder.add_event(
                    event::EventUnion::EventUnion_Cursor,
                    msg_builder.builder.CreateStruct<event::Cursor>(msg_session_paper->cursor).Union()
            );
        }
    }


    if (!msg_builder.empty()) {
        msg_builder.finish();
        auto msg_serialized = std::make_shared<MsgSerialized>(std::move(msg_builder.builder));
        for (auto &msg_session : msg_sessions) {
            auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);

            if (!msg_session_paper->streaming)
                msg_session_paper->enqueue(msg_serialized);
        }

    }

}

void SharedSessionPaper::join(std::shared_ptr<MsgSession> new_msg_session) {
    //do insert it ourselfs and find new cid, so we only have to lock once
    std::unique_lock<std::mutex> lock(msg_sessions_mutex);

    auto new_msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(new_msg_session);

    //index all used ids
    std::bitset<256> used_ids; //uint8_t max
    for (const auto &msg_session: msg_sessions) {
        auto msg_session_paper = std::static_pointer_cast<MsgSessionPaper>(msg_session);
        used_ids.set(msg_session_paper->id);
    }

    //find first unused id (skip 0, its used for local echo)
    for (uint8_t client_id = 1; client_id < 255; client_id++) {
        //found free id
        if (!used_ids[client_id]) {
            //set id and join
            new_msg_session_paper->id = client_id;
            msg_sessions.insert(new_msg_session_paper);
            DEB("Client joined as " << int(client_id) << " to shared paper session " << this->id);

            //send join message back to client
            MsgBuilder mb(200);
            mb.add_event(event::EventUnion::EventUnion_Join,
                         event::CreateJoin(mb.builder, mb.builder.CreateString(this->id), client_id).Union());
            new_msg_session->enqueue(mb);

            //start streaming
            SharedSessionPaper::start_stream(new_msg_session_paper);
            return;

        }

    }

    throw (program_error("Max number of clients has been reached for this paper"));


}

void SharedSessionPaper::leave(std::shared_ptr<MsgSession> new_msg_session) {
    SharedSession::leave(new_msg_session);


}


void SharedSessionPaper::addDrawIncrement(const event::DrawIncrement *draw_increment) {
    std::unique_lock<std::mutex> lock(msg_builder_mutex);

    msg_builder.add_event(
            event::EventUnion::EventUnion_DrawIncrement,
            msg_builder.builder.CreateStruct<event::DrawIncrement>(*draw_increment).Union()
    );

    //store to persistent storage buffer? (will be storage/emptied in store()
    if (draw_increment->store()) {
        msg_builder_storage.add_event(
                event::EventUnion::EventUnion_DrawIncrement,
                msg_builder_storage.builder.CreateStruct<event::DrawIncrement>(*draw_increment).Union()
        );
    }

}


//STATIC global io thread (slow but shouldn't interfere). only called by 1 thread.
//note: this will keep shared sessions alive until the last data is saved.
//HOWEVER: it will miss data if a client joins for shorter that interval-time. (which shouldnt matter that much, as long as its short enough)
void SharedSessionPaper::io_thread() {

    const auto interval = 5; //seconds

    using frames = std::chrono::duration<int64_t, std::ratio<interval, 1>>;

    auto start_time = std::chrono::system_clock::now();


    std::list<std::shared_ptr<SharedSession>> store_shared_sessions;

    while (!stop) {
        std::this_thread::sleep_until(start_time + frames{1});
        start_time = std::chrono::system_clock::now();

        //store all data in collected sessions to disk (this is allowed to be slow)
        for (const auto &shared_session: store_shared_sessions) {
            auto shared_session_paper = std::static_pointer_cast<SharedSessionPaper>(shared_session);
            shared_session_paper->store();
        }

        //clear our list, this allows sharedsessions without clients to be destroyed.
        store_shared_sessions.clear();

        {
            //make a new copy of all the shared session pointers that are new/still left.
            //this keeps lock-time low
            //AND to allow us to save the last data after the last client has left.
            std::unique_lock<std::mutex> lock(SharedSession::shared_sessions_mutex);

            for (const auto &[id, shared_session_weak]: SharedSession::shared_sessions) {
                auto shared_session = shared_session_weak.lock();
                if (shared_session != nullptr)
                    store_shared_sessions.push_back(shared_session);
            }
        }

        //stream data to clients
        {

            std::unique_lock<std::mutex> lock(SharedSessionPaper::streaming_msg_sessions_mutex);
            for (const auto &msg_session_paper: SharedSessionPaper::streaming_msg_sessions) {
                if (msg_session_paper->streaming) {
                    static_pointer_cast<SharedSessionPaper>(msg_session_paper->shared_session)->stream(
                            msg_session_paper);
                }

            }
        }

    }
}


//store msg_builder_storage to disk.
// Called periodicly by the global storage thread.
void SharedSessionPaper::store() {
    //no locking needed: done by one global thread.

    MsgSerialized store_buffer;
    {
        //move buffer, to minimize locking time
        std::unique_lock<std::mutex> lock(msg_builder_mutex);

        if (msg_builder_storage.empty())
            return;

        msg_builder_storage.finishSizePrefixed();
        store_buffer = std::move(msg_builder_storage.builder);
    }

    //now store it to disk, no problem if its slow
    fs.seekp(0, std::ios_base::end);
    fs.write(reinterpret_cast<char *>(store_buffer.GetBufferPointer()), store_buffer.GetSize());
}

//STATIC.
//add session to global streaming list.
void SharedSessionPaper::start_stream(const std::shared_ptr<MsgSessionPaper> &msg_session_paper) {
    std::unique_lock<std::mutex> lock(SharedSessionPaper::streaming_msg_sessions_mutex);

    msg_session_paper->streaming_offset=0;
    msg_session_paper->streaming=true;
    SharedSessionPaper::streaming_msg_sessions.push_back(msg_session_paper);


}

//STATIC
//remove sessions from global streaming list
void SharedSessionPaper::end_stream(const std::shared_ptr<MsgSessionPaper> &msg_session_paper) {
    std::unique_lock<std::mutex> lock(SharedSessionPaper::streaming_msg_sessions_mutex);
    SharedSessionPaper::streaming_msg_sessions.remove(msg_session_paper);
}

// stream next block of data to specified msg_session
// Called periodicly by the global io-thread.
void SharedSessionPaper::stream(const std::shared_ptr<MsgSessionPaper> &msg_session_paper) {
    flatbuffers::uoffset_t buflen;


    //read message size from last offset
    fs.seekg(msg_session_paper->streaming_offset, std::ios::beg);
    fs.read(reinterpret_cast<char *>(&buflen), sizeof(buflen));

    //create buffer, and read actual message
    auto msg_serialized = std::make_shared<MsgSerialized>(buflen);
    msg_serialized->Finish(event::CreateMessage(*msg_serialized));
//FIXME: illegal
    fs.read(reinterpret_cast<char *>(msg_serialized->GetBufferPointer()), sizeof(buflen));

    //verify buffer (to detect corruption)
    //NOTE: we can skip this if we want the performance?
    auto verifier = flatbuffers::Verifier(msg_serialized->GetBufferPointer(),
                                          buflen);

    if (!event::VerifyMessageBuffer(verifier)) {
        msg_session_paper->enqueue_error("File is corrupt.");
        msg_session_paper->streaming = false;
        return;
    }

    //update streaming offset or end streaming
    //FIXME: also finish/send msg_buuilder_storage
    msg_session_paper->streaming_offset = fs.tellg();
    if (fs.eof())
        msg_session_paper->streaming = false;

    //send message
    msg_session_paper->enqueue(msg_serialized);

}







