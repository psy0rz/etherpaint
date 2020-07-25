#include <map>
#include <chrono>
#include <string>
#include <memory>
#include <cstdlib>
#include <restbed>

using namespace std;
using namespace restbed;
using namespace std::chrono;

vector< shared_ptr< Session > > sessions;

void register_event_source_handler( const shared_ptr< Session > session )
{
	static long id = 0;
    id++;

	const auto headers = multimap< string, string > {
		{ "Connection", "keep-alive" },
		{ "Cache-Control", "no-cache" },
		{ "Content-Type", "text/event-stream" },
		{ "Access-Control-Allow-Origin", "*" } //Only required for demo purposes.
	};
    session->set("blaat", id);

	session->yield( OK, headers, [ ]( const shared_ptr< Session > session )
	{
		sessions.push_back( session );
	} );
}

void event_stream_handler( void )
{
	static size_t counter = 0;
	// const auto message = "data: event " + to_string( counter ) + "\n\n";

	sessions.erase(
		  std::remove_if(sessions.begin(), sessions.end(),
                                [](const shared_ptr<Session> &a) {
                                  return a->is_closed();
                                }),
		  sessions.end());

	for ( auto session : sessions )
	{
        auto message = "data: event " + to_string((long)session->get("blaat"))  + "\n\n";
		session->yield( message );
	}

	counter++;
}

int main( const int, const char** )
{
    auto resource = make_shared< Resource >( );
    resource->set_path( "/stream" );
    resource->set_method_handler( "GET", register_event_source_handler );
    
    auto settings = make_shared< Settings >( );
    settings->set_port( 1984 );
    settings->set_worker_limit(10);
    
    auto service = make_shared< Service >( );
    service->publish( resource );
    service->schedule( event_stream_handler, milliseconds( 1000/25 ) );
    service->start( settings );
    
    return EXIT_SUCCESS;
}
