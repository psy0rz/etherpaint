// #include "rapidjson/document.h"
#include "messages_generated.h"

#include <string>
#include <memory>

typedef const event::Message * msg_type;
typedef flatbuffers::FlatBufferBuilder msg_serialized_type;

// std::shared_ptr<msg_type> 
// new_event( const char* event_name)
// {
//   auto document = std::make_shared<rapidjson::Document>(rapidjson::kObjectType);
//   rapidjson::Document::AllocatorType& a = document->GetAllocator();

//   (*document).AddMember("event", rapidjson::StringRef(event_name), a);
//   (*document).AddMember("pars", rapidjson::Value(rapidjson::kObjectType) , a);
//   return (document);
// }
