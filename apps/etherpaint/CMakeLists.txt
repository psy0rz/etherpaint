cmake_minimum_required(VERSION 3.13.4)
project(paper)

set(CMAKE_CXX_STANDARD 20)

# messages.fbs input path:
set(MESSAGES_FBS_PATH ${CMAKE_SOURCE_DIR})
# output path for messages_genearated.h and .js:
set(MESSAGES_GENERATED_H_PATH ${CMAKE_SOURCE_DIR})
set(MESSAGES_GENERATED_JS_PATH ${CMAKE_SOURCE_DIR}/wwwdir)

#this will:
# - git clone and build all the stuff
# - set: ${FLATBUFFERS_INCLUDE_DIR} and ${UWEBSOCKETS_INCLUDE_DIRS}
# - generate messages_generated header and js files.
add_subdirectory(../../messages messages)

include_directories(
        ../..
        ${CMAKE_SOURCE_DIR}
        ${MESSAGES_GENERATED_H_PATH}
        ${FLATBUFFERS_INCLUDE_DIR}
        ${UWEBSOCKETS_INCLUDE_DIRS}
)

add_executable(${PROJECT_NAME} main.cpp SharedSessionPaper.cpp MsgSessionPaper.cpp )
target_link_libraries(${PROJECT_NAME} messages)
