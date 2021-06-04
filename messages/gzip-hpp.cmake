ExternalProject_Add(
    gzip
    PREFIX "vendor/gzip"
    GIT_REPOSITORY "https://github.com/mapbox/gzip-hpp.git"
    GIT_TAG master
    TIMEOUT 10
    CONFIGURE_COMMAND "" #leave commented so cmake uses the cmakelists.txt of this external project.
    BUILD_COMMAND ""
    INSTALL_COMMAND ""
    UPDATE_COMMAND ""
)

ExternalProject_Get_Property(gzip SOURCE_DIR)
set(GZIP_INCLUDE_DIR ${SOURCE_DIR}/include)
set(GZIP_INCLUDE_DIR ${SOURCE_DIR}/include PARENT_SCOPE)

add_definitions(-D ZLIB_CONST )

