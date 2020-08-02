/* Released under GNU General Public License v3.0
 * (C) Edwin Eefting -- ediwn@datux.nl 
 *
 * This framework is designed with performance and scalability in mind. All design decisions are made accordingly:
 *  - I choose restbed because its superfast, clean, stable and has server-side event support. (and is event driven and multi threaded)
 *  - I choose rapidjson because its the fastest AND it has a nice DOM API. (and stable and secure as well, its created by the desginers of Weechat i think, it has regression testing and 100% testing coverage)
 *  - We dont use regular cookies (for performance reasons, we send up to 25 POSTs per second)
 *  - We dont want extra headers, so we stay compatible with proxies.
 *  - Note that a "session" here is an active message-stream from the server to a javascript instance in the browser. Not to be confused with regular php session stuff.
 * 
 * The external message format (json) between browser and server:
 *  - Every message contains the session id and a bunch of events. (events are batched for performance reasons)
 *  - Data can be any json compatible structure.
 *  - Messages from/to server have the same format:
 * 
 *    [ "sessionid", [ [ "eventname", data ], [ ... ] ] ]
 *
 *  - Messages FROM server to brower are sent via server-sent events via the url /events:
 *  - As soon as this connection dies, the session becomes invalid and all is lost. :)  (javascript stuff will nicely reconnect/resync)
 *
 * The internal message format (C++):
 *  - For performance reasons we stay as close to rapidjson as possible, so we dont have to create extra copies or datastructures. 
 *  - EventHandlers are called with references to the rapidjson document object.
 *  - Only after execution of all eventhandlers the object will be discarded and an OK will be yielded.
 * 
 * 
 * 
 */

#include <map>
#include <chrono>
#include <string>
#include <memory>
#include <cstdlib>
// #include <restbed>
#include <iostream>
#include <fstream>
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "rapidjson/error/en.h"

#include <boost/regex.hpp>
#include "msg_session_manager.hpp"
#include "log.hpp"
#include "filecache.hpp"
#include <thread>

#include <App.h>

using namespace rapidjson;

using namespace std;
// using namespace restbed;
using namespace std::chrono;



// MsgSessionManager msg_session_manager;


// //handle incomming message via /send
// void handle_send(const shared_ptr<Session> session)
// {
// 	const auto request = session->get_request();

// 	size_t content_length = request->get_header("Content-Length", 0);

// 	session->fetch(content_length, [request](const shared_ptr<Session> session, const Bytes &body) {
// 		// fprintf(stdout, "RAW %.*s\n", (int)body.size(), body.data());

// 		auto document = make_shared<Document>();
// 		//note: can perhaps prevent a copy by using document->ParseInsitu
// 		document->Parse(reinterpret_cast<const char *>(body.data()), body.size());

// 		if (document->HasParseError())
// 		{
// 			stringstream error_text;
// 			error_text << "Parse error at offset " << document->GetErrorOffset() << ": " << GetParseError_En(document->GetParseError()) << "\n";

// 			yield_text(*session, INTERNAL_SERVER_ERROR, error_text.str());
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

using namespace uWS;

FileCacher file_cacher("../wwwdir");

int main(const int, const char **)
{



	std::vector<std::thread *> threads(std::thread::hardware_concurrency());

	std::transform(threads.begin(), threads.end(), threads.begin(), [](std::thread *t) {
		return new std::thread([]() {

#ifdef SSL
			uWS::SSLApp({.key_file_name = "../misc/key.pem",
						 .cert_file_name = "../misc/cert.pem",
						 .passphrase = "1234"})
#else
																				  uWS::App()
#endif
				.get("/*", [](auto *res, auto *req) {
					auto file = file_cacher.get(string(req->getUrl()));

					if (file == file_cacher.m_cached_files.end())
					{
						res->writeStatus("404");
						res->end("not found");
					}
					else
						res->end(file->second.m_view);

					return;
				})
				.listen(3000, [](auto *token) {
					if (token)
					{

						INFO("Listening on port " << 3000 << std::endl)
					}
				})
				.run();
		});
	});

	std::for_each(threads.begin(), threads.end(), [](std::thread *t) {
		t->join();
	});


	return EXIT_SUCCESS;
}
