#include "log.hpp"
#include "program_error.hpp"
#include <filesystem>
#include <fstream>
#include <gzip/config.hpp>
#include <gzip/compress.hpp>

#include <string>
#include <utility>


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
    std::filesystem::path m_path;

    std::string m_content_type;

    //normal content and view
    std::vector<char> m_content;
    std::string_view m_view;

    //has a compressed version that is smaller?
    bool m_compressed;
    std::vector<char> m_content_compressed;
    std::string_view m_view_compressed;


    void reload() {

//        DEB("Caching " << m_path);

        if (content_type_map.find(m_path.extension()) == content_type_map.end())
        {
//            WARNING(m_path << ": Filetype not supported " << m_path.extension());
            m_content_type="application/octet-stream";

        }
        else {
            m_content_type = content_type_map.at(m_path.extension());
        }

        //open
        std::ifstream file(m_path, std::ios::binary | std::ios::ate);
        file.exceptions(std::ifstream::failbit | std::ifstream::badbit);

        //get size
        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        //read into buffer
        m_content.resize(size);
        file.read(m_content.data(), size);

        //try to compress
        std::string compressed=gzip::compress(m_content.data(), m_content.size());

        //compressable?
        m_content_compressed.clear();
        if (compressed.size()<size)
        {
            std::copy(compressed.begin(), compressed.end(), std::back_insert_iterator(m_content_compressed));
            this->m_compressed=true;
        }
        else
        {
            this->m_compressed=false;
        }

        // uwebsockets uses views
        m_view = std::string_view(m_content.data(), m_content.size());
        m_view_compressed = std::string_view(m_content_compressed.data(), m_content_compressed.size());

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


    void load(std::string root_dir) {
        INFO("Compressing and caching files under " << root_dir)
        m_root_dir = root_dir;
        for (auto &dir_entry :
                std::filesystem::recursive_directory_iterator(m_root_dir)) {
            if (dir_entry.is_regular_file()) {

                std::string url(dir_entry.path().string());
                url.erase(0, m_root_dir.length());

                m_cached_files[url] = std::make_unique<CachedFile>(dir_entry.path());
//                DEB("Web path: " << url);
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
