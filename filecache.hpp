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

    CachedFile(std::filesystem::path path) {
        m_path = path;
        INFO("Caching " << path);

        if (content_type_map.find(path.extension()) == content_type_map.end())
            throw (program_error("Filetype not supported"));

        m_content_type = content_type_map.at(path.extension());

        std::ifstream file(path, std::ios::binary | std::ios::ate);
        file.exceptions(std::ifstream::failbit | std::ifstream::badbit);

        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        m_content.resize(size);
        file.read(m_content.data(), size);

        // uwebsockets uses views
        m_view = std::string_view(m_content.data(), m_content.size());
    }
};

class FileCacher {

public:
    std::string m_root_dir;

    typedef std::map<std::string, CachedFile> t_cached_files;
    t_cached_files m_cached_files;

    FileCacher(std::string root_dir) {
        m_root_dir = root_dir;

        for (auto &dir_entry :
                std::filesystem::recursive_directory_iterator(m_root_dir)) {
            if (dir_entry.is_regular_file()) {

                std::string url(dir_entry.path().string());
                url.erase(0, m_root_dir.length());

                CachedFile cached_file(dir_entry.path());
//                m_cached_files.insert(std::make_pair(url, CachedFile(dir_entry.path())));
                DEB("Web path: " << url);
            }
        }
    }

    auto get(std::string url) { return (m_cached_files.find(url)); }
};
