ExternalProject_Add(
        uwebsockets
        PREFIX "vendor/uwebsockets"
        GIT_REPOSITORY "https://github.com/uNetworking/uWebSockets.git"
        GIT_TAG v18.11.0
        GIT_SUBMODULES_RECURSE On
        TIMEOUT 10
        CONFIGURE_COMMAND "" #leave commented so cmake uses the cmakelists.txt of this external project.
        BUILD_COMMAND WITH_OPENSSL=1 CC=${CMAKE_C_COMPILER} make -j1 -C <SOURCE_DIR>/uSockets
        INSTALL_COMMAND ""
        UPDATE_COMMAND ""
)

ExternalProject_Get_Property(uwebsockets SOURCE_DIR)
set(UWEBSOCKETS_INCLUDE_DIRS ${SOURCE_DIR}/src ${SOURCE_DIR}/uSockets/src PARENT_SCOPE)
set(UWEBSOCKETS_INCLUDE_DIRS ${SOURCE_DIR}/src ${SOURCE_DIR}/uSockets/src )
set(LIBUSOCKETS ${SOURCE_DIR}/uSockets/uSockets.a)


