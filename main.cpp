/* Released under GNU General Public License v3.0
 * (C) Edwin Eefting -- ediwn@datux.nl
 *
 * This framework is designed with performance and scalability in mind. All
 * design decisions are made accordingly:
 *  - I choose uwebsockets because its the fastest out here. (first did some  testing with restbed which is awesome as well)
 *  - I switched to binary flatbuffers because of performance, and it still has a nice api. Also nice streaming support to store growing objects on the server. ( Tried rapidjson first: I choose rapidjson because its the fastest AND it has a nice DOM API. (and stable and secure as well, its created by the desginers of Weechat i think)
 *
 *
 *
 *
 */

/* test results:

In release mode, without SSL, without compression:

psy@ws1 ~/Downloads/wrk % ./wrk http://localhost:3000/edit.html  -d 10  -t 10 -c
125 Running 10s test @ http://localhost:3000/edit.html 10 threads and 125
connections Thread Stats   Avg      Stdev     Max   +/- Stdev Latency
0.85ms    1.72ms  37.17ms   91.00%
    Req/Sec    34.18k     8.07k   65.92k    77.57%
  3419501 requests in 10.09s, 29.97GB read
Requests/sec: 338940.14
Transfer/sec:      2.97GB



*/

#define ENABLE_SSL false

#include <chrono>
#include <cstdlib>
#include <map>
#include <memory>
#include <string>
// #include <restbed>

// uwebsockets
#include <App.h>

#include <boost/regex.hpp>
#include <fstream>
#include <iostream>
#include <thread>

#include "filecache.hpp"

#include "handler_manager.hpp"
#include "log.hpp"
#include "msg_session.hpp"

#include "messages_generated.h"

#include "plugin_config.hpp"


FileCacher file_cacher("../wwwdir");

struct PerSocketData
{
  std::shared_ptr<MsgSession> msg_session;
};

int
main(const int, const char**)
{
  std::vector<std::thread*> threads(std::thread::hardware_concurrency());

  std::transform(
    threads.begin(), threads.end(), threads.begin(), [](std::thread* t) {
      return new std::thread([]() {
        uWS::TemplatedApp<ENABLE_SSL>({ .key_file_name = "/home/psy/key.pem",
                                        .cert_file_name = "/home/psy/cert.pem",
                                        .passphrase = "" })
          .get("/*",
               [](auto* res, auto* req) {
                 DEB("get " << req->getUrl())
                 auto file = file_cacher.get(std::string(req->getUrl()));

                 if (file == file_cacher.m_cached_files.end()) {
                   res->writeStatus("404");
                   res->end("not found");
                 } else
                   res->end(file->second.m_view);

                 return;
               })
          .ws<PerSocketData>(
            "/ws",
            { //  .compression = uWS::SHARED_COMPRESSOR,
              .compression = uWS::DISABLED,
              .maxPayloadLength = 1024,
              .idleTimeout = 1000,
              .maxBackpressure = 0,
              /* Handlers */
              .open =
                [](auto* ws) {
                  DEB("websocket open from IP "
                      << ws->getRemoteAddressAsText());
                  // create message session
                  auto msg_session = std::make_shared<MsgSession>(ws);
                  static_cast<PerSocketData*>(ws->getUserData())->msg_session =
                    msg_session;
                },
              // received websocket message
              .message =
                [](auto* ws, std::string_view message_buffer, uWS::OpCode opCode) {
                  auto& msg_session =
                    static_cast<PerSocketData*>(ws->getUserData())->msg_session;

                  if (opCode != uWS::BINARY) {
                    ERROR("Received invalid websocket opcode");
                    return;
                  }

                  //todo: stream of messages in one websocket message
                  
                  if (!event::VerifyMessageBuffer(flatbuffers::Verifier(message_buffer.data(), message_buffer.length())))
                  {
                    ERROR("Corrupt flatbuffer received.");
                    return;
                  }

                  auto message = event::GetMessage(message_buffer.data());
                  auto event_type=message->event_type();

                  if (event_type<0 || event_type>event::EventUnion_MAX)
                  {
                    ERROR("Invalid event type: " << event_type);
                    return;
                  }

                  if (handlers[event_type]==nullptr)
                  {
                    ERROR("Handler not set: " << event::EnumNameEventUnion(event_type));
                    return;
                  }

                  {
                    try {
                        
                        handlers[event_type](msg_session, message);

                    } catch (std::exception e) {
                      ERROR("Exception while handling " << event::EnumNameEventUnion(event_type)
                                                        << ": " << e.what());
#ifndef NDEBUG
                      throw;
#endif
                    }
                  }
                },
              .drain =
                [](auto* ws) {
                  // buffered amount changed, check if we have some more queued
                  // messages that can be send
                  //TODO: optimize/test. not wait until its completely empty?
                  if (ws->getBufferedAmount() == 0) {
                    DEB("backpressure gone, sending queue");

                    static_cast<PerSocketData*>(ws->getUserData())
                      ->msg_session->send_queue();
                  }
                },
              .ping = [](auto* ws) { DEB("websocket ping" << ws); },
              .pong = [](auto* ws) { DEB("websocket pong" << ws); },
              .close =
                [](auto* ws, int code, std::string_view message) {
                  // DEB("websocket close" << ws);
                  static_cast<PerSocketData*>(ws->getUserData())
                    ->msg_session->closed();
                } })

          .listen(3000,
                  [](auto* token) {
                    if (token) {
                      INFO("Listening");
                    }
                  })
          .run();
      });
    });

  // while (1) {
  //   if (lastsess != nullptr) {
  //     lastsess->enqueue_error(
  //       "dummydatadummydatadummydatadummydatadummydatadummydatadummydatadummyda"
  //       "tadummydatadummydatadummydatadummydatadummydatadummydatadummydatadummy"
  //       "datadummydatadummydatadummydatadummydatadummydatadummydatadummydatadum"
  //       "mydatadummydatadummydatadummydatadummydatadummydatadummydatadummydatad"
  //       "ummydatadummydatadummydatadummydatadummydatadummydatadummydatadummydat"
  //       "adummydatadummydatadummydatadummydatadummydatadummydatadummydatadummyd"
  //       "atadummydatadummydatadummydatadummydatadummydatadummydatadummydatadumm"
  //       "ydatadummydatadummydatadummydatadummydatadummydatadummydatadummydatadu"
  //       "mmydatadummydatadummydatadummydatadummydatadummydatadummydatadummydata"
  //       "dummydata");
  //   }
  //   std::this_thread::sleep_for(std::chrono::milliseconds(1));
  // }

  std::for_each(
    threads.begin(), threads.end(), [](std::thread* t) { t->join(); });
  ERROR("FAILED to listen");
  return EXIT_SUCCESS;
}
