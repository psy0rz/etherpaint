#include <fstream>
#include "log.hpp"
#include <filesystem>

using namespace std;

//todo: configurable?
const map<string, string> content_type_map{
    {
        "css",
        "text/css",
    },
    {
        "html",
        "text/html",
    },
    {
        "",
        "text/html",
    },
    {
        "js",
        "application/javascript",
    },
    {
        "gif",
        "image/gif",
    },
    {
        "jpeg",
        "image/jpeg",
    },
    {
        "jpg",
        "image/jpeg",
    },
    {
        "png",
        "image/png",
    },
    {
        "htc",
        "text/x-component",
    },
    {
        "swf",
        "application/x-shockwave-flash",
    },
    {"svg", "image/svg+xml"}};

class CachedFile
{
public:
    string m_content_type;
    vector<char> m_content;
    string m_path;

    CachedFile(string &path)
    {
        m_path = path;
        INFO("Caching " << path);

        
        ifstream file(path, std::ios::binary | std::ios::ate);
        file.exceptions ( ifstream::failbit | ifstream::badbit );
        
        streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        m_content.resize(size);
        file.read(m_content.data(),size);

    }
};

class FileCache
{

public:
    string m_root_dir;
    map<string,  CachedFile > m_cached_files;

    FileCache(string root_dir)
    {
        m_root_dir = root_dir;

        for (auto &dir_entry : filesystem::recursive_directory_iterator(m_root_dir))
        {
            if (dir_entry.is_regular_file())
            {
                string path_str(dir_entry.path().string());

                m_cached_files.insert(make_pair(path_str, CachedFile(path_str)));
            }
        }
    }
};
