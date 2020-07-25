
#include <map>
#include <mutex>
#include <chrono>
#include <string>
#include <memory>
#include <random>
#include <cstdlib>
#include "msg_session.hpp"

using namespace std;

class MsgSessionManager
{
    public:
        MsgSessionManager( void ) : m_msg_sessions_lock( ),
            m_msg_sessions( )
        {
            return;
        }
        
        ~MsgSessionManager( void )
        {
            return;
        }
                
        //create new MsgSession
        shared_ptr<MsgSession> create( )
        {
            auto msg_session=make_shared<MsgSession>();

            {
                unique_lock< mutex > lock( m_msg_sessions_lock );

                m_msg_sessions[msg_session->m_id]=msg_session;

            }            

            return(msg_session);
        }
        
        //find existing session (also prunes expired sessions)
        shared_ptr<MsgSession> find( string & id )
        {
            unique_lock< mutex > lock( m_msg_sessions_lock );

            
            auto previous_session = m_msg_sessions.find( id );
            if ( previous_session not_eq m_msg_sessions.end( ) )
            {
                //expired?
                if (previous_session->second.expired())
                {
                    m_msg_sessions.erase(previous_session);
                }
                else
                {
                    return(previous_session->second.lock());
                }
            }

            return(nullptr);

        }
        
        
    private:
        mutex m_msg_sessions_lock;
        
        map< string, weak_ptr< MsgSession > > m_msg_sessions;
};

