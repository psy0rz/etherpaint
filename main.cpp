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

#include <App.h>

using namespace rapidjson;

using namespace std;
// using namespace restbed;
using namespace std::chrono;

// vector<shared_ptr<Session>> sessions;

// void yield_text(Session &session, const int status = 200, const string &text = "", const std::function<void(std::shared_ptr<restbed::Session>)> &callback = nullptr)
// {
// 	const multimap<string, string> headers{
// 		{"Connection", "keep-alive"},
// 		{"Content-Length", ::to_string(text.length())}};

// 	session.yield(status, text, headers, callback);
// }

// //handle static content
// void handle_static(const shared_ptr<Session> session)
// {
// 	const auto request = session->get_request();
// 	const string filename = request->get_path_parameter("filename");

// 	ifstream stream("../wwwdir/" + filename, ifstream::in);

// 	if (!stream.is_open())
// 	{
// 		yield_text(*session, NOT_FOUND, "File not found.\n");
// 	}
// 	else
// 	{
// 		boost::smatch what;
// 		if (!regex_search(
// 				filename,
// 				what,
// 				boost::regex("([^.]*$)")))
// 		{
// 			yield_text(*session, INTERNAL_SERVER_ERROR, "Incorrect filename format\n");
// 		}
// 		else
// 		{
// 			//send file
// 			string extention = what[1];
// 			string content_type = content_type_map.at(extention);
// 			const string body = string(istreambuf_iterator<char>(stream), istreambuf_iterator<char>());

// 			const multimap<string, string> headers{
// 				{"Content-Type", content_type},
// 				{"Connection", "keep-alive"},
// 				{"Content-Length", ::to_string(body.length())}};

// 			session->yield(OK, body, headers);
// 		}
// 	}
// }

// MsgSessionManager msg_session_manager;

// //register new server side event session
// void handle_events(const shared_ptr<Session> session)
// {
// 	static long id = 0;
// 	id++;

// 	const auto headers = multimap<string, string>{
// 		{"Connection", "keep-alive"},
// 		{"Cache-Control", "no-cache"},
// 		{"Content-Type", "text/event-stream"},
// 		{"Access-Control-Allow-Origin", "*"} //Only required for demo purposes.
// 	};

// 	session->yield(OK, headers, [](const shared_ptr<Session> session) {
// 		//this is also what keeps the session alive
// 		auto msg_session = msg_session_manager.create(session);

// 		string message;
// 		message += "data: event ";
// 		message += msg_session->m_id;
// 		message += "\n\n";
// 		session->yield(message);
// 	});
// }

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

#ifdef SSL
	uWS::SSLApp({.key_file_name = "../misc/key.pem",
				 .cert_file_name = "../misc/cert.pem",
				 .passphrase = "1234"})
#else
	uWS::App()
#endif
		.get("/*", [](auto *res, auto *req) {
			// string s;

			// string_view view();
			auto  file=file_cacher.get(string(req->getUrl()));
			

			if (file==file_cacher.m_cached_files.end())
			{
				res->writeStatus("404");
				res->end("not found");
			}
			else
				res->end(file->second.m_view);



			// res->onWritable([s,res](int offset) {
			// // res->cork([s,res,offset] {

			// 	   ERROR("WIL MEER!" << offset)
			// 		res->tryEnd(s, 100000000);
			// 	   ERROR("MEER gegeve!" << offset)
			// // });
			// 	   return true;


			//    })
			// 	->onAborted([]() {
			// 		ERROR("ABORTED!");
			// 	});
				
			// ERROR("STARTS");
			// ERROR("START");
			// res->tryEnd(s, 100000000);
			// ERROR("done");


			// res->cork([res] {
			// 	while (true)
			// 	{
			// 		std::pair<bool, bool> status;
			// 		status = res->tryEnd("Hello worl", 1000000);
			// 		if (!status.first) 
			// 		{
			// 			ERROR("NOT OK BREAK");
			// 			break;
			// 		}
			// 		if (status.second) 
			// 		{
			// 			ERROR("RESPONDED BREAK");
			// 			break;
			// 		}
			// 		ERROR("SKRIEM")
			// 	}
			// });
			return;
		})
		.listen(3000, [](auto *token) {
			if (token)
			{

				INFO("Listening on port " << 3000 << std::endl)
			}
		})
		.run();

	// auto service = make_shared<Service>();

	// {
	// 	auto resource = make_shared<Resource>();
	// 	resource->set_path("/static/{filename: [a-zA-Z0-9._-]*}");
	// 	resource->set_method_handler("GET", handle_static);
	// 	service->publish(resource);
	// }
	// {
	// 	auto resource = make_shared<Resource>();
	// 	resource->set_path("/events");
	// 	resource->set_method_handler("GET", handle_events);
	// 	service->publish(resource);
	// }
	// {
	// 	auto resource = make_shared<Resource>();
	// 	resource->set_path("/send");
	// 	resource->set_method_handler("POST", handle_send);
	// 	service->publish(resource);
	// }

	// service->schedule(send_events, milliseconds(1000));
	// // service->set_session_manager( make_shared< InMemorySessionManager >( ) );

	// auto settings = make_shared<Settings>();
	// settings->set_port(1984);
	// settings->set_worker_limit(10);
	// settings->set_connection_limit(1000);
	// service->start(settings);

	return EXIT_SUCCESS;
}
