ExternalProject_Add(
    flatbuffers
    PREFIX "vendor/flatbuffers"
    GIT_REPOSITORY "https://github.com/google/flatbuffers.git"
    GIT_TAG v1.12.0
    TIMEOUT 10
    CMAKE_ARGS
        -G "Unix Makefiles"
        -DCMAKE_BUILD_TYPE=Debug
        -DFLATBUFFERS_BUILD_TESTS=OFF
    # CONFIGURE_COMMAND "" #leave commented so cmake uses the cmakelists.txt of this external project.
    # BUILD_COMMAND ""
    INSTALL_COMMAND ""
    UPDATE_COMMAND ""
)

ExternalProject_Get_Property(flatbuffers BINARY_DIR SOURCE_DIR)
set(FLATC ${BINARY_DIR}/flatc)
set(FLATBUFFERS_INCLUDE_DIR ${SOURCE_DIR}/include)
set(FLATBUFFERS_INCLUDE_DIR ${SOURCE_DIR}/include PARENT_SCOPE)
