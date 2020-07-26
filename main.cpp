#include <map>
#include <chrono>
#include <string>
#include <memory>
#include <cstdlib>
#include <restbed>
#include <iostream>
#include <fstream>
#include "rapidjson/document.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/writer.h"
#include "rapidjson/error/en.h"

#include <boost/regex.hpp>
#include "msg_session_manager.hpp"
#include "log.hpp"

using namespace rapidjson;

using namespace std;
using namespace restbed;
using namespace std::chrono;

vector<shared_ptr<Session>> sessions;

const map<string, string> content_type_map{
	{
		"css",
		"text/css",
	},
	{
		"html",
		"text/html",
	},
	{
		"",
		"text/html",
	},
	{
		"js",
		"application/javascript",
	},
	{
		"gif",
		"image/gif",
	},
	{
		"jpeg",
		"image/jpeg",
	},
	{
		"jpg",
		"image/jpeg",
	},
	{
		"png",
		"image/png",
	},
	{
		"htc",
		"text/x-component",
	},
	{
		"swf",
		"application/x-shockwave-flash",
	},
	{"svg", "image/svg+xml"}};

void yield_text(Session &session, const int status = 200, const string &text = "", const std::function<void(std::shared_ptr<restbed::Session>)> &callback = nullptr)
{
	const multimap<string, string> headers{
		{"Connection", "keep-alive"},
		{"Content-Length", ::to_string(text.length())}};

	session.yield(status, text, headers, callback);
}

//handle static content
void handle_static(const shared_ptr<Session> session)
{
	const auto request = session->get_request();
	const string filename = request->get_path_parameter("filename");

	ifstream stream("../wwwdir/" + filename, ifstream::in);

	if (!stream.is_open())
	{
		yield_text(*session, NOT_FOUND, "File not found.\n");
	}
	else
	{
		boost::smatch what;
		if (!regex_search(
				filename,
				what,
				boost::regex("([^.]*$)")))
		{
			yield_text(*session, INTERNAL_SERVER_ERROR, "Incorrect filename format\n");
		}
		else
		{
			//send file
			string extention = what[1];
			string content_type = content_type_map.at(extention);
			const string body = string(istreambuf_iterator<char>(stream), istreambuf_iterator<char>());

			const multimap<string, string> headers{
				{"Content-Type", content_type},
				{"Connection", "keep-alive"},
				{"Content-Length", ::to_string(body.length())}};

			session->yield(OK, body, headers);
		}
	}
}

MsgSessionManager msg_session_manager;

//register new server side event session
void handle_events(const shared_ptr<Session> session)
{
	static long id = 0;
	id++;

	const auto headers = multimap<string, string>{
		{"Connection", "keep-alive"},
		{"Cache-Control", "no-cache"},
		{"Content-Type", "text/event-stream"},
		{"Access-Control-Allow-Origin", "*"} //Only required for demo purposes.
	};

	session->yield(OK, headers, [](const shared_ptr<Session> session) {
		//this is also what keeps the session alive
		auto msg_session = msg_session_manager.create(session);

		string message;
		message += "data: event ";
		message += msg_session->m_id;
		message += "\n\n";
		session->yield(message);
	});
}

// //send data to all connected sessions
void send_events(void)
{
	// msg_session_manager.sendall();
	// static size_t counter = 0;
	// // const auto message = "data: event " + to_string( counter ) + "\n\n";

	// sessions.erase(
	// 	std::remove_if(sessions.begin(), sessions.end(),
	// 				   [](const shared_ptr<Session> &a) {
	// 					   return a->is_closed();
	// 				   }),
	// 	sessions.end());

	// for (auto session : sessions)
	// {
	// 	auto message = "data: event \n\n";
	// 	session->yield(message);
	// }

	// counter++;
}

//handle incomming message via /send
void handle_send(const shared_ptr<Session> session)
{
	const auto request = session->get_request();

	size_t content_length = request->get_header("Content-Length", 0);

	session->fetch(content_length, [request](const shared_ptr<Session> session, const Bytes &body) {
		// fprintf(stdout, "RAW %.*s\n", (int)body.size(), body.data());

		auto document = make_shared<Document>();
		//note: can perhaps prevent a copy by using document->ParseInsitu
		document->Parse(reinterpret_cast<const char *>(body.data()), body.size());

		if (document->HasParseError())
		{
			stringstream error_text;
			error_text << "Parse error at offset " << document->GetErrorOffset() << ": " << GetParseError_En(document->GetParseError()) << "\n";

			yield_text(*session, INTERNAL_SERVER_ERROR, error_text.str());
		}
		else
		{
			//convert test
			StringBuffer buffer;
			Writer<StringBuffer> writer(buffer);
			document->Accept(writer);
			DEB("stringified " << buffer.GetString());

			session->yield(OK, multimap<string, string>{
								   {"Connection", "keep-alive"}});
		}
	});
}

int main(const int, const char **)
{
	auto service = make_shared<Service>();

	{
		auto resource = make_shared<Resource>();
		resource->set_path("/static/{filename: [a-zA-Z0-9._-]*}");
		resource->set_method_handler("GET", handle_static);
		service->publish(resource);
	}
	{
		auto resource = make_shared<Resource>();
		resource->set_path("/events");
		resource->set_method_handler("GET", handle_events);
		service->publish(resource);
	}
	{
		auto resource = make_shared<Resource>();
		resource->set_path("/send");
		resource->set_method_handler("POST", handle_send);
		service->publish(resource);
	}

	service->schedule(send_events, milliseconds(1000));
	// service->set_session_manager( make_shared< InMemorySessionManager >( ) );

	auto settings = make_shared<Settings>();
	settings->set_port(1984);
	settings->set_worker_limit(10);
	// cout << "timeout " << settings->get_connection_timeout().count() << endl;
	// cout << "limit " << settings->get_connection_limit() << endl;
	service->start(settings);

	return EXIT_SUCCESS;
}
