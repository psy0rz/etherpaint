using namespace std;

#include <map>
#include <mutex>
#include <string>
#include <memory>
#include <random>
#include <cstdlib>
#include "log.hpp"

class MsgSession
{
public:
    string m_id;
    shared_ptr <restbed::Session> m_send_session;

    MsgSession(const shared_ptr<restbed::Session> & send_session)
    {
        static const string charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        static uniform_int_distribution<> selector(0, charset.length()-1);

        auto seed = static_cast<unsigned int>(chrono::high_resolution_clock::now().time_since_epoch().count());
        static mt19937 generator(seed);

        for (int index = 0; index < 8; index++)
        {
            m_id += charset.at(selector(generator));
        }

        m_send_session=send_session;

        DEB("Created new session " << m_id);
    }
};