#include "MsgSession.h"

void MsgSession::join(std::shared_ptr<SharedSession> shared_session) {

    {
        std::lock_guard<std::mutex> lock(mutex);

        if (this->shared_session != nullptr) {
            throw (std::logic_error("Already joined"));
        }
        this->shared_session = shared_session;
    }
    shared_session->join(shared_from_this());
}

void MsgSession::join(const std::string &id) {
    join(SharedSession::get(id));
}

void MsgSession::closed() {
    std::lock_guard<std::mutex> lock(mutex);
    ws = nullptr;
    if (shared_session != nullptr)
        shared_session->leave(shared_from_this());

    shared_session = nullptr;
}

MsgSession::MsgSession(uWS::WebSocket<ENABLE_SSL, true> *ws) {
    this->ws = ws;
    // uwebsocket is single threaded, but supports deffering from other threads
    // Store loop for the current thread. (the one thats belongs to this ws)
    this->loop = uWS::Loop::get();

    // DEB("Created new msg session");
}

MsgSession::~MsgSession() {
    DEB("Destroyed msg session");;
}

void MsgSession::send_queue() {
    std::lock_guard<std::mutex> lock(mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
        return;

    // int before = msg_queue.size();
    ws->cork([this]() {
        while (!msg_queue.empty() && !ws->getBufferedAmount()) {
            auto msg_serialized_ptr = msg_queue.back();
            msg_queue.pop_back();

            std::string_view msg_view(
                    reinterpret_cast<char *>(msg_serialized_ptr->GetBufferPointer()),
                    msg_serialized_ptr->GetSize());

            auto ok = ws->send(msg_view, uWS::BINARY, true);

            if (!ok)
                break;
        }
    });
    if (msg_queue.size() != 0) {
        DEB("got backpresure, messages left in queue: " << msg_queue.size());
    }
}

void MsgSession::enqueue(const std::shared_ptr<msg_serialized_type> &msg_serialized) {
    std::lock_guard<std::mutex> lock(mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
        return;

    // if queue was empty, ws will never call send_queue(), so make it call it
    if (msg_queue.empty()) {
        // notify websocket thread to start sending
        // auto msg_session(shared_from_this());
        loop->defer(
                [msg_session = shared_from_this()]() { msg_session->send_queue(); });
    }

    msg_queue.push_front(msg_serialized);
//    INFO("Q=" << msg_queue.size());
}

//finishes msg_builder and moves it in to a shared_ptr and enqueues it
void MsgSession::enqueue(MsgBuilder &msg_builder) {

    msg_builder.finish();
    enqueue(std::make_shared<msg_serialized_type>(std::move(msg_builder.builder)));
}


void MsgSession::enqueue_error(const std::string &description) {

    MsgBuilder msg_builder(100);

    msg_builder.add_event(
            event::EventUnion_Error,
            event::CreateError(msg_builder.builder,
                               msg_builder.builder.CreateString(description)).Union()
    );

    enqueue(msg_builder);
}

