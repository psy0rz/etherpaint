cmake_minimum_required(VERSION 3.8)
project(restbed_test)
include(GNUInstallDirs)

set(EXTERNAL_PROJECTS_PREFIX ${CMAKE_BINARY_DIR}/external-projects)
set(EXTERNAL_PROJECTS_INSTALL_PREFIX ${EXTERNAL_PROJECTS_PREFIX}/installed)
include(ExternalProject)

# ##################### fetch/build restbed
# if(EXISTS "${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a")
#     message(AUTHOR_INFO "Not rebuilding librestbed. Delete ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a if you want to rebuild. You should now be able to build the project.")
# else()

#     ExternalProject_Add(externalRestbed
#         PREFIX "${EXTERNAL_PROJECTS_PREFIX}"
#         GIT_REPOSITORY "https://github.com/Corvusoft/restbed.git"
#         GIT_TAG "4.7"
#         UPDATE_DISCONNECTED true
#         CMAKE_ARGS 
#             -DCMAKE_INSTALL_PREFIX=${EXTERNAL_PROJECTS_INSTALL_PREFIX}
#             -DCMAKE_INSTALL_LIBDIR=${CMAKE_INSTALL_LIBDIR}
#             -DBUILD_SSL=OFF
#             -DBUILD_TESTS=OFF
#         )
#     # if(NOT EXISTS "${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include")
#     #     # Happens on first CMake run.
#     #     # Can't continue because the below `find_package(REQUIRED)` will fail.
#     #     # Build all external project targets then rerun CMake and build the project target.
#     message(AUTHOR_WARNING "Build all external projects then rerun cmake.")
#     return()
#     # endif()

# # add_dependencies(${PROJECT_NAME} externalRestbed)
# endif()




############################ main project
file(GLOB sources *.cpp)
MESSAGE(STATUS "Detected source files: ${sources}")

add_executable(${PROJECT_NAME} ${sources})

set_target_properties(${PROJECT_NAME} PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED YES
    CXX_EXTENSIONS NO
    )

# add_dependencies(${PROJECT_NAME} externalRestbed)

############################# build usockets
set(LIBUSOCKETS ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets/uSockets.a)
add_custom_command(
    COMMENT "Compiling usockets"
    OUTPUT ${LIBUSOCKETS}
    # COMMAND WITH_WOLFSSL=1 WITH_LIBUV=1 make -j1 
    # COMMAND WITH_OPENSSL=1 CC=${CMAKE_C_COMPILER} AR=${CMAKE_C_COMPILER_AR}  make -j1 
    DEPENDS ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets
    COMMAND WITH_OPENSSL=1 CC=${CMAKE_C_COMPILER} AR=${CMAKE_C_COMPILER_AR}  make -j1 
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets
)
#add_dependencies(${PROJECT_NAME} usockets)
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${LIBUSOCKETS})

############################# build rapid json
include("${CMAKE_SOURCE_DIR}/rapidjson.cmake")
add_dependencies(${PROJECT_NAME} rapidjson)

############################# build flatbuffers flatc compiler
include("${CMAKE_SOURCE_DIR}/flatbuffers.cmake")
add_dependencies(${PROJECT_NAME} flatbuffers)


############################# flatc compile .fbs file
add_custom_command(
    OUTPUT ${CMAKE_SOURCE_DIR}/messages_generated.h
    BYPRODUCTS ${CMAKE_SOURCE_DIR}/messages_generated.h
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    DEPENDS ${CMAKE_SOURCE_DIR}/messages.fbs 
    COMMENT "Generating flatbuffers header file"
    COMMAND ${FLATC} --cpp ${CMAKE_SOURCE_DIR}/messages.fbs 
)
# add_dependencies(${PROJECT_NAME} ${CMAKE_SOURCE_DIR}/messages_generated.h )
set_property(SOURCE main.cpp APPEND PROPERTY OBJECT_DEPENDS ${CMAKE_SOURCE_DIR}/messages_generated.h)


#find_package(restbed REQUIRED)
include_directories(
    # ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include
    ${CMAKE_SOURCE_DIR}
    ${RAPIDJSON_INCLUDE_DIR}
    ${FLATBUFFERS_INCLUDE_DIR}
    ${CMAKE_SOURCE_DIR}/lib/uWebSockets/src
    ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets/src
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
find_package( Boost 1.65.1 REQUIRED thread regex system filesystem)
target_link_libraries(${PROJECT_NAME} PRIVATE ${Boost_LIBRARIES})

