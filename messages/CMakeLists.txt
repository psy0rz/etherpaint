#i had some issues with git cloning in 3.16
cmake_minimum_required(VERSION 3.17)
project(messages)
include(GNUInstallDirs)

set(EXTERNAL_PROJECTS_PREFIX ${CMAKE_BINARY_DIR}/external-projects)
set(EXTERNAL_PROJECTS_INSTALL_PREFIX ${EXTERNAL_PROJECTS_PREFIX}/installed)
include(ExternalProject)


############################ main project
#file(GLOB sources *.cpp)
#MESSAGE(STATUS "Detected source files: ${sources}")

#add_executable(${PROJECT_NAME} main.cpp messages/MsgSession.cpp config.h messages/SharedSession.cpp SharedSessionPaper.cpp)
add_library(${PROJECT_NAME} messages.cpp MsgSession.cpp SharedSession.cpp messages.h register_handler.cpp)

set_target_properties(${PROJECT_NAME} PROPERTIES
        CXX_STANDARD 20
        CXX_STANDARD_REQUIRED YES
        CXX_EXTENSIONS NO
        )


############################# clone/build uwebsockets
include("uwebsockets.cmake")
add_dependencies(${PROJECT_NAME} uwebsockets)

############################# clone/build flatbuffers flatc compiler
include("flatbuffers.cmake")
add_dependencies(${PROJECT_NAME} flatbuffers)


############################# flatc compile .fbs to .h
add_custom_command(
        OUTPUT ${MESSAGES_GENERATED_H_PATH}/messages_generated.h
        BYPRODUCTS ${MESSAGES_GENERATED_H_PATH}/messages_generated.h
#        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        DEPENDS ${MESSAGES_FBS_PATH}/messages.fbs
        COMMENT "Generating ${MESSAGES_GENERATED_H_PATH}/messages_generated.h from ${MESSAGES_FBS_PATH}/messages.fbs"
        COMMAND ${FLATC} --reflect-names -o ${MESSAGES_GENERATED_H_PATH} --cpp ${CMAKE_SOURCE_DIR}/messages.fbs
)
# add_dependencies(${PROJECT_NAME} ${CMAKE_SOURCE_DIR}/messages_generated.h )
set_property(SOURCE messages.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_SOURCE_DIR}/messages_generated.h)

############################# flatc compile .fbs to .js
add_custom_command(
        OUTPUT ${MESSAGES_GENERATED_JS_PATH}/messages_generated.js
        BYPRODUCTS ${MESSAGES_GENERATED_JS_PATH}/messages_generated.js
#        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        DEPENDS ${MESSAGES_FBS_PATH}/messages.fbs
        COMMENT "Generating ${MESSAGES_GENERATED_JS_PATH}/messages_generated.js from ${MESSAGES_FBS_PATH}/messages.fbs"
        COMMAND ${FLATC} --reflect-names -o ${MESSAGES_GENERATED_JS_PATH} --js ${MESSAGES_FBS_PATH}/messages.fbs
)
set_property(SOURCE messages.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_SOURCE_DIR}/wwwdir/messages_generated.js)


#find_package(restbed REQUIRED)
include_directories(
        # ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include
        ${CMAKE_SOURCE_DIR}
        ${FLATBUFFERS_INCLUDE_DIR}
        ${MESSAGES_GENERATED_H_PATH}
        ${UWEBSOCKETS_INCLUDE_DIRS}
)

#add_library(${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a )
#target_link_libraries(${PROJECT_NAME} PRIVATE restbed)
# target_link_libraries(${PROJECT_NAME} PRIVATE ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a)

link_libraries(stdc++fs)

target_link_libraries(${PROJECT_NAME} PRIVATE ${LIBUSOCKETS} z ssl crypto)
# set_property(TARGET usockets PROPERTY INTERPROCEDURAL_OPTIMIZATION True)

set(CMAKE_THREAD_PREFER_PTHREAD TRUE)
set(THREADS_PREFER_PTHREAD_FLAG TRUE)
find_package(Threads REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE Threads::Threads)

INCLUDE(FindBoost)
set(Boost_USE_MULTITHREADED ON)
find_package(Boost 1.65.1 REQUIRED thread regex system filesystem)
target_link_libraries(${PROJECT_NAME} PRIVATE ${Boost_LIBRARIES})

