#ifndef MSG_HPP
#define MSG_HPP

#include "messages_generated.h"

#include <string>
#include <memory>


typedef const event::Message *msg_type;
//typedef flatbuffers::FlatBufferBuilder MsgSerialized;



//incremental message builder
//build a serialized message in memory, allows adding events
class MsgBuilder {
private:

    std::vector<flatbuffers::Offset<void>> event_offsets;
    std::vector<uint8_t> event_types;

public:
    flatbuffers::FlatBufferBuilder builder;


    MsgBuilder(size_t size) : builder(size) {

    };

    void add_event(const uint8_t &event_type, const flatbuffers::Offset<void> &event_offset) {
        event_types.push_back(event_type);
        event_offsets.push_back(event_offset);
    }

    void finish() {

        builder.Finish(event::CreateMessage(
                builder,
                builder.CreateVector(event_types),
                builder.CreateVector(event_offsets)
        ));

        event_types.clear();
        event_offsets.clear();

    }

    void finishSizePrefixed() {
        builder.FinishSizePrefixed(event::CreateMessage(
                builder,
                builder.CreateVector(event_types),
                builder.CreateVector(event_offsets)
        ));

        event_types.clear();
        event_offsets.clear();

    }


    bool empty() {
        return (event_types.empty());
    }


};


//serialized form of a message. modelled to work with flatbuffers allocators
class MsgSerialized {
private:
    uint8_t *data_; //pointer to allocated memory block
    size_t size_; //total size allocated memory block
    size_t offset_; //offset where actual data starts (probably the flatbuffer-data)
    //the offset is a side effect of the way flatbuffers work: zero copy means your buffer is always too big.

public:

    //creates unallocated. use operator = to assign later
    MsgSerialized():data_(nullptr) {

    }

    //create new empty buffer with specified size
    MsgSerialized(const size_t size) : size_(size), offset_(0), data_(flatbuffers::DefaultAllocator().allocate(size)) {

    }

    //create from a finished flatbuffer builder
    //NOTE: just copies pointers and clears the flatbuffer
    MsgSerialized(flatbuffers::FlatBufferBuilder &&fb) {
        data_ = fb.ReleaseRaw(size_, offset_);
        fb.Clear();
    }

    //create from a finished MsgBuilder
    //NOTE: just copies pointers and clears the flatbuffer
    MsgSerialized(MsgBuilder &&mb) {
        data_ = mb.builder.ReleaseRaw(size_, offset_);
        mb.builder.Clear();
    }

    //move operator
    MsgBuilder & operator=( MsgBuilder &&mb) {
        data_ = mb.builder.ReleaseRaw(size_, offset_);
        mb.builder.Clear();
        return(mb);
    }

    //get pointer to actual data
    inline uint8_t *data() {
        return (data_ + offset_);
    }

    //get size of actual data
    inline size_t size() {
        return (size_ - offset_);
    }

    virtual ~MsgSerialized() {
        if (data_!=nullptr)
            flatbuffers::DefaultAllocator().deallocate(data_, size_);
    }
};


#endif