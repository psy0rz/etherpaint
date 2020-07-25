#include <map>
#include <chrono>
#include <string>
#include <memory>
#include <cstdlib>
#include <restbed>
#include <iostream>
#include "rapidjson/document.h"     // rapidjson's DOM-style API
#include "rapidjson/prettywriter.h" // for stringify JSON
using namespace rapidjson;




using namespace std;
using namespace restbed;
using namespace std::chrono;

vector<shared_ptr<Session>> sessions;

//handle static content
void handle_static( const shared_ptr< Session > session )
{
    // const auto request = session->get_request( );
    // const string filename = request->get_path_parameter( "filename" );
    
    // ifstream stream( "./" + filename, ifstream::in );
    
    // if ( stream.is_open( ) )
    // {
    //     const string body = string( istreambuf_iterator< char >( stream ), istreambuf_iterator< char >( ) );
        
    //     const multimap< string, string > headers
    //     {
    //         { "Content-Type", "text/html" },
    //         { "Content-Length", ::to_string( body.length( ) ) }
    //     };
        
    //     session->close( OK, body, headers );
    // }
    // else
    // {
    //     session->close( NOT_FOUND );
    // }
}

//register new session
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
	session->set("blaat", id);

	session->yield(OK, headers, [](const shared_ptr<Session> session) {
		sessions.push_back(session);
	});
}

//send data to all connected sessions
void send_events(void)
{
	static size_t counter = 0;
	// const auto message = "data: event " + to_string( counter ) + "\n\n";

	sessions.erase(
		std::remove_if(sessions.begin(), sessions.end(),
					   [](const shared_ptr<Session> &a) {
						   return a->is_closed();
					   }),
		sessions.end());

	for (auto session : sessions)
	{
		auto message = "data: event " + to_string((long)session->get("blaat")) + "\n\n";
		session->yield(message);
	}

	counter++;
}

void handle_cursor(const shared_ptr<Session> session)
{
	send_events();
}

int main(const int, const char **)
{
	auto service = make_shared<Service>();

	{
		auto resource = make_shared<Resource>();
		resource->set_path("/static/{filename: [a-z]*\\.html}");
		resource->set_method_handler("GET", handle_static);
	}
	{
		auto resource = make_shared<Resource>();
		resource->set_path("/events");
		resource->set_method_handler("GET", handle_events);
		service->publish(resource);
	}
	{
		auto resource = make_shared<Resource>();
		resource->set_path("/cursor");
		resource->set_method_handler("GET", handle_cursor);
		service->publish(resource);
	}

	// service->schedule( send_events, milliseconds( 1000/25 ) );

	auto settings = make_shared<Settings>();
	settings->set_port(1984);
	settings->set_worker_limit(10);
	service->start(settings);

	return EXIT_SUCCESS;
}
