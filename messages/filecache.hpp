#include "log.hpp"
#include "program_error.hpp"
#include <filesystem>
#include <fstream>
// #include <boost/regex.hpp>

//  using namespace std;

const std::map<std::string, std::string> content_type_map{
        {".css",  "text/css"},
        {".html", "text/html"},
        {".js",   "application/javascript"},
        {".gif",  "image/gif"},
        {".jpeg", "image/jpeg"},
        {".jpg",  "image/jpeg"},
        {".png",  "image/png"},
        {".htc",  "text/x-component"},
        {".swf",  "application/x-shockwave-flash"},
        {".svg",  "image/svg+xml"}
};

class CachedFile {
public:
    std::string m_content_type;
    std::vector<char> m_content;
    std::filesystem::path m_path;

    std::string_view m_view;


    void reload() {

        INFO("Caching " << m_path);

        if (content_type_map.find(m_path.extension()) == content_type_map.end())
            throw (program_error("Filetype not supported"));

        m_content_type = content_type_map.at(m_path.extension());


        std::ifstream file(m_path, std::ios::binary | std::ios::ate);
        file.exceptions(std::ifstream::failbit | std::ifstream::badbit);

        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        m_content.resize(size);
        file.read(m_content.data(), size);

        // uwebsockets uses views
        m_view = std::string_view(m_content.data(), m_content.size());

    }

    CachedFile(std::filesystem::path path) {
        m_path = path;
        reload();
    }
};

class FileCacher {

public:
    std::string m_root_dir;

    typedef std::map<std::string, std::unique_ptr<CachedFile>> t_cached_files;
    t_cached_files m_cached_files;
//    std::mutex mutex;


    FileCacher(std::string root_dir) {
        m_root_dir = root_dir;
        for (auto &dir_entry :
                std::filesystem::recursive_directory_iterator(m_root_dir)) {
            if (dir_entry.is_regular_file()) {

                std::string url(dir_entry.path().string());
                url.erase(0, m_root_dir.length());

                m_cached_files[url] = std::make_unique<CachedFile>(dir_entry.path());
                DEB("Web path: " << url);
            }
        }
    }

    auto get(const std::string & url) {

#ifndef NDEBUG
//woops violates string_view constant guarantees:
//        //disable cache during debug. and even do locking. argggh :)
//        std::lock_guard<std::mutex> lock(mutex);
//        m_cached_files.find(url)->second->reload();
#endif

        return (m_cached_files.find(url));

    }
};
