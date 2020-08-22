
#include <map>
#include <mutex>
#include <chrono>
#include <string>
#include <memory>
#include <random>
#include <cstdlib>
#include "msg_session.hpp"


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
        shared_ptr<MsgSession> create( const shared_ptr<restbed::Session> & send_session)
        {
            auto msg_session=make_shared<MsgSession>(send_session);

            {
                unique_lock< mutex > lock( m_msg_sessions_lock );

                m_msg_sessions[msg_session->m_id]=msg_session;

            }            

            return(msg_session);
        }
        
        //find existing session (alsco prunes expired sessions)
        shared_ptr<MsgSession> find( const string & id )
        {
            unique_lock< mutex > lock( m_msg_sessions_lock );

            
            auto previous_session = m_msg_sessions.find( id );
            if ( previous_session not_eq m_msg_sessions.end( ) )
            {
                //not closed?
                if (!previous_session->second->expired())
                {
                    return(previous_session->second);
                }
            }

            return(nullptr);

        }

        void sendall()
        {

        }
        
        
    private:
        mutex m_msg_sessions_lock;
        
        map< string, shared_ptr< MsgSession > > m_msg_sessions;
};

