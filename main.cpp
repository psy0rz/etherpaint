#include <map>
#include <chrono>
#include <string>
#include <memory>
#include <cstdlib>
#include <restbed>
#include <iostream>
#include <fstream>
#include "rapidjson/document.h"
#include "rapidjson/prettywriter.h"
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

//handle static content
//TOOD: keepalive
void handle_static(const shared_ptr<Session> session)
{
	const auto request = session->get_request();
	const string filename = request->get_path_parameter("filename");

	ifstream stream("../wwwdir/" + filename, ifstream::in);

	// static int count=1;


	// if (!session->has("count"))
	// {
	// 	count++;
	// 	DEB ("new connection " << count );
	// 	session->set("count", count);
	// }



	if (stream.is_open())
	{
		boost::smatch what;
		if (!regex_search(
				filename,
				what,
				boost::regex("([^.]*$)")))
		{
			string errormsg;
			errormsg = "Incorrect filename format";
			const multimap<string, string> headers{
				{"Connection", "keep-alive"},
				{"Content-Length", ::to_string(errormsg.length())}};

			session->yield(INTERNAL_SERVER_ERROR, errormsg, headers);
		}
		else
		{
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
	else
	{
		string errormsg;
		errormsg = "Cant find file ";
		errormsg += filename;

		const multimap<string, string> headers{
			{"Connection", "keep-alive"},
			{"Content-Length", ::to_string(errormsg.length())}};

		session->yield(NOT_FOUND, errormsg, headers);
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
		auto msg_session = msg_session_manager.create();
		session->set("msg_session", msg_session);
		sessions.push_back(session);

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

void handle_send(const shared_ptr<Session> session)
{
	string body;
	body = "Moiii";

	const multimap<string, string> headers{
		{"Content-Type", "application/json"},
		{"Content-Length", ::to_string(body.length())},
		{"Connection", "keep-alive"},
	};

	session->yield(OK, body, headers);
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
