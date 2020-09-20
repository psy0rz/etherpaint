#ifndef MSG_HPP
#define MSG_HPP

#include "messages_generated.h"

#include <string>
#include <memory>


typedef const event::Message *msg_type;
typedef flatbuffers::FlatBufferBuilder MsgSerialized;


//incremental message builder
//build a serialized message in memory, allows adding events
class MsgBuilder {
private:

    std::vector<flatbuffers::Offset<void>> event_offsets;
    std::vector<uint8_t> event_types;

public:
    MsgSerialized builder;


    MsgBuilder(size_t size):builder(size)
    {

    };

    void add_event(const uint8_t & event_type, const flatbuffers::Offset<void> & event_offset)
    {
        event_types.push_back(event_type);
        event_offsets.push_back(event_offset);
    }

    void finish()
    {

        builder.Finish(event::CreateMessage(
                builder,
                builder.CreateVector(event_types),
                builder.CreateVector(event_offsets)
        ));

        event_types.clear();
        event_offsets.clear();

    }

    void finishSizePrefixed()
    {
        builder.FinishSizePrefixed(event::CreateMessage(
                builder,
                builder.CreateVector(event_types),
                builder.CreateVector(event_offsets)
        ));

        event_types.clear();
        event_offsets.clear();

    }


    bool empty()
    {
        return(event_types.empty());
    }



};





#endif