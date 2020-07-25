cmake_minimum_required(VERSION 3.8)
project(restbed_test)
include(GNUInstallDirs)

set(EXTERNAL_PROJECTS_PREFIX ${CMAKE_BINARY_DIR}/external-projects)
set(EXTERNAL_PROJECTS_INSTALL_PREFIX ${EXTERNAL_PROJECTS_PREFIX}/installed)
include(ExternalProject)

if(EXISTS "${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a")
    message(AUTHOR_WARNING "Not rebuilding librestbed. Delete ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a if you want to rebuild. You should now be able to build the project.")
else()

    ExternalProject_Add(externalRestbed
        PREFIX "${EXTERNAL_PROJECTS_PREFIX}"
        GIT_REPOSITORY "https://github.com/Corvusoft/restbed.git"
        GIT_TAG "4.7"
        UPDATE_DISCONNECTED true
        CMAKE_ARGS 
            -DCMAKE_INSTALL_PREFIX=${EXTERNAL_PROJECTS_INSTALL_PREFIX}
            -DCMAKE_INSTALL_LIBDIR=${CMAKE_INSTALL_LIBDIR}
        )
    # if(NOT EXISTS "${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include")
    #     # Happens on first CMake run.
    #     # Can't continue because the below `find_package(REQUIRED)` will fail.
    #     # Build all external project targets then rerun CMake and build the project target.
    message(AUTHOR_WARNING "Build all external projects then rerun cmake.")
    return()
    # endif()

# add_dependencies(${PROJECT_NAME} externalRestbed)

endif()

add_executable(${PROJECT_NAME} main.cpp)
set_target_properties(${PROJECT_NAME} PROPERTIES
    CXX_STANDARD 14
    CXX_STANDARD_REQUIRED YES
    CXX_EXTENSIONS NO
    )

# add_dependencies(${PROJECT_NAME} externalRestbed)

#find_package(restbed REQUIRED)
include_directories(${EXTERNAL_PROJECTS_INSTALL_PREFIX}/include)
#add_library(${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a )
#target_link_libraries(${PROJECT_NAME} PRIVATE restbed)
target_link_libraries(${PROJECT_NAME} PRIVATE ${EXTERNAL_PROJECTS_INSTALL_PREFIX}/lib/librestbed.a)

find_package(Threads REQUIRED)
target_link_libraries(${PROJECT_NAME} PRIVATE Threads::Threads)
