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

############################# build rapid json
include("${CMAKE_SOURCE_DIR}/rapidjson.cmake")


############################# build usockets
set(LIBUSOCKETS ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets/uSockets.a)
add_custom_target(
    usockets
    BYPRODUCTS ${LIBUSOCKETS}
    COMMAND make -j1
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets
)

############################ main project
file(GLOB sources *.cpp)
MESSAGE(STATUS "Detected source files: ${sources}")

add_executable(${PROJECT_NAME}  ${sources})
set_target_properties(${PROJECT_NAME} PROPERTIES
    CXX_STANDARD 17
    CXX_STANDARD_REQUIRED YES
    CXX_EXTENSIONS NO
    )

# add_dependencies(${PROJECT_NAME} externalRestbed)
add_dependencies(${PROJECT_NAME} rapidjson)
add_dependencies(${PROJECT_NAME} usockets)


#find_package(restbed REQUIRED)
include_directories(
    # ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include
    ${RAPIDJSON_INCLUDE_DIR}
    ${CMAKE_SOURCE_DIR}/lib/uWebSockets/src
    ${CMAKE_SOURCE_DIR}/lib/uWebSockets/uSockets/src
    )

#add_library(${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a )
#target_link_libraries(${PROJECT_NAME} PRIVATE restbed)
# target_link_libraries(${PROJECT_NAME} PRIVATE ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a)


target_link_libraries(${PROJECT_NAME} PRIVATE ${LIBUSOCKETS} z)
# set_property(TARGET usockets PROPERTY INTERPROCEDURAL_OPTIMIZATION True)

set(CMAKE_THREAD_PREFER_PTHREAD TRUE)
set(THREADS_PREFER_PTHREAD_FLAG TRUE)
find_package(Threads REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE Threads::Threads)

INCLUDE(FindBoost)
set(Boost_USE_MULTITHREADED ON)
find_package( Boost 1.65.1 REQUIRED thread regex system filesystem)
target_link_libraries(${PROJECT_NAME} PRIVATE ${Boost_LIBRARIES})

