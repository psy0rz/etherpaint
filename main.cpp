#include <iostream>
#include <memory>
#include <restbed>

using namespace std;
using namespace restbed;

int main(int argc, char* argv[])
{
    cout << "kkk" << endl;
    auto resource = make_shared< Resource >( );
    resource->set_path( "/test" );
    resource->set_method_handler( "GET", []( const shared_ptr< Session > session ) -> void
    {
        const auto request = session->get_request( );
        session->close( OK, "Hello, World!", { { "Content-Length", "13" } } );
    } );

    auto settings = std::make_shared<restbed::Settings>();
    // settings=NULL;
    settings->set_port(1111);
    settings->set_default_header("Connection", "close");

    restbed::Service service;
    service.publish(resource);
    service.start(settings);

    return 0;
}

