/* Released under GNU General Public License v3.0
 * (C) Edwin Eefting -- edwin@datux.nl
 *
 * This framework is designed with performance and scalability in mind. All
 * design decisions are made accordingly:
 *  - I choose uwebsockets because its the fastest out here. (first did some
 * testing with restbed which is awesome as well)
 *  - I switched to binary flatbuffers because of performance, and it still has
 * a nice api. Also nice streaming support to store growing objects on the
 * server. ( Tried rapidjson first: I choose rapidjson because its the fastest
 * AND it has a nice DOM API. (and stable and secure as well, its created by the
 * desginers of Weechat i think)
 * - Seastar is also an interesting event framework to look at, but it doesnt have websockets yet, and it seems overkill: uses polling, so always uses 100% cpu, and build to use with dedicated 10Gb hardware.
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

#include "config.h"

#include <chrono>
#include <cstdlib>
#include <map>
#include <memory>
#include <string>

// uwebsockets
#include <App.h>

//#include <fstream>
#include <iostream>
#include <thread>

#include "messages.h"

#include "filecache.hpp"

//#include "messages/register_handler.hpp"
#include "log.hpp"
#include "MsgSession.h"

#include "flatbuffers/flatbuffers.h"
#include "messages_generated.h"
#include "register_handler.h"


FileCacher file_cacher;

struct PerSocketData {
    std::shared_ptr<MsgSession> msg_session;
};


//simple http server that redirects to http
void http_server(ini::IniFile &config) {
    uWS::App ()
            .get("/*",
                 [&](auto *res, auto *req) {

                     res->writeStatus("301");
                     res->writeHeader("Location", config["webserver"]["http_redir"].as<std::string>());
                     res->end();
                 })
            .listen(config["webserver"]["port"].as<int>(),
                    [](auto *socket) {
                        if (socket) {
                            INFO("HTTP redirector thread started");
                        }
                    })
            .run();
    ERROR("HTTP redirector failed: " << errno);

};

int message_server(ini::IniFile &config) {

    file_cacher.load(config["webserver"]["wwwdir"].as<std::string>());

    //multi threaded ssl server (fails if cert is missing)
    std::vector<std::thread *> threads(std::thread::hardware_concurrency());
    std::transform(
            threads.begin(), threads.end(), threads.begin(), [&](std::thread *t) {

                return new std::thread([&]() {
                    INFO("Message server: Starting on port " << (config["webserver"]["ssl_port"].as<int>()));

                    uWS::TemplatedApp<ENABLE_SSL>({
                                                          .key_file_name = config["webserver"]["ssl_key"].as<const char *>(),
                                                          .cert_file_name = config["webserver"]["ssl_cert"].as<const char *>(),
                                                          .passphrase = "",

                                                  })
                            //static data
                            .get("/*",
                                 [&](auto *res, auto *req) {
                                     auto file_name = std::string(req->getUrl());

                                     if (file_name == "/")
                                         file_name = "/index.html";

                                     //HACK: paper stuff doesnt belong here, make more generic.
                                     if (file_name.starts_with("/d/"))
                                         file_name = "/paper.html";

                                     auto file = file_cacher.get(file_name);

                                     if (file == file_cacher.m_cached_files.end()) {
                                         res->writeStatus("404");
                                         res->end("not found");
                                     } else {
                                         res->writeHeader("Content-Type", file->second->m_content_type);
                                         res->writeHeader("Cache-Control",config["webserver"]["cache_control"].as<std::string>());

                                         //can we use compression and do we have a compressed version?
                                         if (req->getHeader("accept-encoding").find("gzip")!=std::string::npos && file->second->m_compressed)
                                         {
                                            res->writeHeader("content-encoding", "gzip");
                                            res->end(file->second->m_view_compressed);
                                         }
                                         else
                                         {
                                             res->end(file->second->m_view);
                                         }

                                     }
                                 })
                            .ws<PerSocketData>(
                                    "/ws",
                                    {
                                            .compression = uWS::SHARED_COMPRESSOR,
//                                            .compression = uWS::DISABLED,
                                            .maxPayloadLength = 10024,
                                            .idleTimeout = 1000,
                                            .maxBackpressure = 0,
                                            /* Handlers */

                                            //websocket opened
                                            .open =
                                            [](auto *ws) {
//                                                DEB("websocket open from IP "
//                                                            << ws->getRemoteAddressAsText());
                                                // create message session
//                                                auto msg_session = std::make_shared<MsgSession>(ws);
                                                auto msg_session = MsgSession::create(ws);
                                                static_cast<PerSocketData *>(ws->getUserData())->msg_session =
                                                        msg_session;
                                            },

                                            // received websocket message
                                            .message =
                                            [](auto *ws,
                                               std::string_view message_buffer,
                                               uWS::OpCode opCode) {
                                                auto &msg_session =
                                                        static_cast<PerSocketData *>(ws->getUserData())->msg_session;

                                                if (opCode != uWS::BINARY) {
                                                    msg_session->enqueue_error(
                                                            "Received invalid websocket opcode");
                                                    return;
                                                }

                                                auto verifier = flatbuffers::Verifier((uint8_t *) message_buffer.data(),
                                                                                      message_buffer.length());

                                                if (!event::VerifyMessageBuffer(verifier)) {
                                                    msg_session->enqueue_error("Corrupt flatbuffer received.");
                                                    return;
                                                }

                                                auto message = event::GetMessage(message_buffer.data());

                                                const auto events_size = message->events_type()->size();
                                                for (auto event_index = 0; event_index < events_size; event_index++) {

                                                    auto event_type = message->events_type()->Get(event_index);

                                                    if (event_type < 0 || event_type > event::EventUnion_MAX ||
                                                        handlers[event_type] == nullptr) {
                                                        std::stringstream desc;
                                                        desc
                                                                << "Invalid event type, no handler found for event_type="
                                                                << int(event_type);

                                                        msg_session->enqueue_error(desc.str());
                                                    } else {
                                                        try {
                                                            //THE call
                                                            handlers[event_type](msg_session, message, event_index);

                                                        }
                                                        catch (program_error & e) {
                                                            std::stringstream desc;
                                                            desc << "Program error while handling "
                                                                 << event::EnumNamesEventUnion()[event_type] << ": "
                                                                 << e.what();
                                                            msg_session->enqueue_error(desc.str());
                                                        }
                                                        catch (std::system_error & e) {
                                                            std::stringstream desc;
                                                            desc << "System error while handling "
                                                                 << event::EnumNamesEventUnion()[event_type] << ": "
                                                                 << e.code().message() << ": " << std::strerror(errno);
                                                            msg_session->enqueue_error(desc.str());
                                                        }
                                                        catch (std::exception & e) {
                                                            std::stringstream desc;
                                                            desc << "Exception while handling "
                                                                 << event::EnumNamesEventUnion()[event_type] << ":"
                                                                 << e.what();
                                                            msg_session->enqueue_error(desc.str());

#ifndef NDEBUG
//                                                            throw;
#endif
                                                        }
                                                    }
                                                }
                                            },

                                            .drain =
                                            [](auto *ws) {
                                                // buffered amount changed, check if we have some more queued
                                                // messages that can be send
                                                // TODO: optimize/test. not wait until its completely empty?
                                                if (ws->getBufferedAmount() == 0) {
                                                    DEB("backpressure gone, sending queue");

                                                    static_cast<PerSocketData *>(ws->getUserData())
                                                            ->msg_session->send_queue();
                                                }
                                            },

                                            .ping = [](auto *ws) {DEB("websocket ping" << ws); },

                                            .pong = [](auto *ws) {DEB("websocket pong" << ws); },

                                            .close =
                                            [](auto *ws, int code, std::string_view message) {
                                                // DEB("websocket close" << ws);
                                                static_cast<PerSocketData *>(ws->getUserData())
                                                        ->msg_session->closed();
                                            }})

                            .listen(config["webserver"]["ssl_port"].as<int>(),
                                    [](auto *token) {
                                        if (token) {
                                            INFO("Message server: Listening");
                                        }
                                    })
                            .run();
                    ERROR("Message server: Startup failed (check ssl_cert and ssl_key path): " << errno);

                });
            });


    //simple http redirector (current thread)
    http_server( config);

    std::for_each(
            threads.begin(), threads.end(), [](std::thread *t) { t->join(); });

    return EXIT_SUCCESS;
}
