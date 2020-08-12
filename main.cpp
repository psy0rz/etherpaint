/* Released under GNU General Public License v3.0
 * (C) Edwin Eefting -- ediwn@datux.nl
 *
 * This framework is designed with performance and scalability in mind. All
 * design decisions are made accordingly:
 *  - I choose uwebsockets because its the fastest out here. (first did some
 * testing with restbed which is awesome as well)
 *  - I choose rapidjson because its the fastest AND it has a nice DOM API. (and
 * stable and secure as well, its created by the desginers of Weechat i think,
 * it has regression testing and 100% testing coverage)
 *  - We dont use regular cookies (for performance reasons, we send up to 25
 * POSTs per second)
 *  - Note that a "session" here is an active websocket from the server to
 * a javascript instance in the browser. Not to be confused with regular php
 * session stuff.
 *
 * The external message format (json) between browser and server:
 *  - Messages from/to server have the same format:
 *
 *    [ "eventname", data ]
 *  - Data can be any json compatible structure.
 *
 *  - As soon as this connection dies, the session becomes invalid and all is
 * lost. :)  (javascript stuff will nicely reconnect/resync)
 *
 * The internal message format (C++):
 *  - For performance reasons we stay as close to rapidjson as possible, so we
 * dont have to create extra copies or datastructures.
 *  - EventHandlers are called with references to the rapidjson document object.
 *  - Only after execution of all eventhandlers the object will be discarded.
 *
 *
 *
 */

#define ENABLE_SSL false
#define RAPIDJSON_HAS_STDSTRING 1

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

#include <rapidjson/document.h>
#include <rapidjson/error/en.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>

#include "filecache.hpp"
#include "handler_manager.hpp"
#include "log.hpp"
#include "msg_session.hpp"

// using namespace rapidjson;

// using namespace std;
// using namespace restbed;
// using namespace std::chrono;

// MsgSessionManager msg_session_manager;

// //handle incomming message via /send
// void handle_send(const shared_ptr<Session> session)
// {
// 	const auto request = session->get_request();

// 	size_t content_length = request->get_header("Content-Length", 0);

// 	session->fetch(content_length, [request](const shared_ptr<Session>
// session, const Bytes &body) {
// 		// fprintf(stdout, "RAW %.*s\n", (int)body.size(), body.data());

// 		auto document = make_shared<Document>();
// 		//note: can perhaps prevent a copy by using
// document->ParseInsitu 		document->Parse(reinterpret_cast<const
// char
// *>(body.data()), body.size());

// 		if (document->HasParseError())
// 		{
// 			stringstream error_text;
// 			error_text << "Parse error at offset " <<
// document->GetErrorOffset() << ": " <<
// GetParseError_En(document->GetParseError()) << "\n";

// 			yield_text(*session, INTERNAL_SERVER_ERROR,
// error_text.str());
// 		}
// 		else
// 		{
// 			//convert test
// 			// StringBuffer buffer;
// 			// Writer<StringBuffer> writer(buffer);
// 			// document->Accept(writer);
// 			// DEB("stringified " << buffer.GetString());

// 			yield_text(*session, OK);

// 		}
// 	});
// }

// using namespace uWS;

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
        uWS::TemplatedApp<ENABLE_SSL>({ .key_file_name = "../misc/key.pem",
                                        .cert_file_name = "../misc/cert.pem",
                                        .passphrase = "1234" })
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
            { .compression = uWS::DISABLED,
              .maxPayloadLength = 16 * 1024,
              .idleTimeout = 1000,
              /* Handlers */
              .open =
                [](auto* ws) {
                  DEB("websocket open" << ws);
                  // create message session
                  auto msg_session = std::make_shared<MsgSession>(ws);
                  static_cast<PerSocketData*>(ws->getUserData())->msg_session =
                    msg_session;
                },
              // received websocket message
              .message =
                [](auto* ws, std::string_view message, uWS::OpCode opCode) {
                  auto& msg_session =
                    static_cast<PerSocketData*>(ws->getUserData())->msg_session;

                  if (opCode != uWS::TEXT) {
                    ERROR("Invalid websocket opcode");
                    return;
                  }

                  // parse json string
                  auto document = std::make_shared<rapidjson::Document>();
                  document->Parse(reinterpret_cast<const char*>(message.data()),
                                  message.size());
                  if (document->HasParseError()) {
                    std::stringstream error_text;
                    error_text
                      << "JSON parse error at offset "
                      << document->GetErrorOffset() << ": "
                      << rapidjson::GetParseError_En(document->GetParseError());

                    msg_session->enqueue_error(error_text.str());

                  } else {
                    if (!document->IsObject())
                      msg_session->enqueue_error(
                        "Message error: Message is not an object.");
                    else if (!document->HasMember("event"))
                      msg_session->enqueue_error(
                        "Message error: Message doesn't have key 'event'.");
                    else {
                      rapidjson::Value& v = (*document)["event"];
                      if (!v.IsString())
                        msg_session->enqueue_error(
                          "Message error: Key 'event' isnt a string.");
                      else
                      {
                        DEB("Received " << v.GetString());
                        msg_session->enqueue_msg(document);
                      }
                      // handlers[(*document)["event"].GetString()](ws,
                      // document);
                    }
                  }
                },
              .drain =
                [](auto* ws) {
                  // buffered amount changed, check if we have some more queued
                  // messages that can be send
                  static_cast<PerSocketData*>(ws->getUserData())
                    ->msg_session->send_queue();
                },
              .ping = [](auto* ws) { DEB("websocket ping" << ws); },
              .pong = [](auto* ws) { DEB("websocket pong" << ws); },
              .close =
                [](auto* ws, int code, std::string_view message) {
                  DEB("websocket close" << ws);
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

  std::for_each(
    threads.begin(), threads.end(), [](std::thread* t) { t->join(); });

  return EXIT_SUCCESS;
}
