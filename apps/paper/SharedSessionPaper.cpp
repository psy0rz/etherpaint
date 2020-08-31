//
// Created by psy on 25-08-20.
//

#include "SharedSessionPaper.h"

//shared session factory
std::shared_ptr<SharedSession> SharedSession::create(const std::string & id) {
    std::shared_ptr<SharedSession> shared_session = std::make_shared<SharedSessionPaper>(id);
    return (shared_session);
}



SharedSessionPaper::SharedSessionPaper(const std::string &id) : SharedSession(id) {

    DEB("paper construct " << id);
    papernaam="moi";

}
