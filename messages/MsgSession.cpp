#include "MsgSession.h"

void MsgSession::join(std::shared_ptr<SharedSession> shared_session) {
    std::lock_guard<std::mutex> lock(mutex);
    this->shared_session = shared_session;
    shared_session->join(shared_from_this());
}

void MsgSession::join(const std::string & id) {
    join(SharedSession::get(id));
}

void MsgSession::closed() {
    std::lock_guard<std::mutex> lock(mutex);
    ws = nullptr;
    if (shared_session!=nullptr)
        shared_session->leave(shared_from_this());
}

MsgSession::MsgSession(uWS::WebSocket<ENABLE_SSL, true> *ws) {
    this->ws = ws;
    // uwebsocket is single threaded, but supports deffering from other threads
    // Store loop for the current thread. (the one thats belongs to this ws)
    this->loop = uWS::Loop::get();

    // DEB("Created new msg session");
}

MsgSession::~MsgSession() {
     DEB("Destroyed msg session");
    ;
}

void MsgSession::send_queue() {
    std::lock_guard<std::mutex> lock(mutex);

    // ws was closed in the meantime
    if (ws == nullptr)
        return;

    // int before = msg_queue.size();
    ws->cork([this]() {
        while (!msg_queue.empty() && !ws->getBufferedAmount()) {
            static int i = 0;
            i++;
            // DEB("send " << i << " q=" << msg_queue.size());
            auto &msg_serialized = msg_queue.back();

            std::string_view msg_view(
                    reinterpret_cast<char *>(msg_serialized.GetBufferPointer()),
                    msg_serialized.GetSize());

            auto ok = ws->send(msg_view, uWS::BINARY, true);

            // check

            // auto message = event::GetMessage(msg_serialized.GetBufferPointer());
            // auto event_type=message->event_type();
            // DEB("SEND EVENT TYPE" << event_type);
            // auto kut=message->kut();
            // DEB("SEND kut" << kut);

            msg_queue.pop_back(); // destroys flatbuffer

            if (!ok)
                break;
        }
    });
    if (msg_queue.size() != 0) {
        DEB("got backpresure, messages left in queue: " << msg_queue.size());
    }
}

void MsgSession::enqueue(msg_serialized_type &msg_serialized) {
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

    msg_queue.push_front(std::move(msg_serialized));
}

void MsgSession::enqueue_error(const std::string &description) {

    msg_serialized_type msg_serialized(200);

    std::vector<uint8_t> types;
    types.push_back(event::EventUnion_Error);

    std::vector<flatbuffers::Offset<void>> events;
    events.push_back(event::CreateError(msg_serialized, msg_serialized.CreateString(description)).Union());


    msg_serialized.Finish(event::CreateMessage(
            msg_serialized,
            msg_serialized.CreateVector(types),
            msg_serialized.CreateVector(events)
            ));

    enqueue(msg_serialized);
}
