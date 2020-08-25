//
// Created by psy on 25-08-20.
//

#include "SharedPaper.h"

void SharedPaper::test() {
    DEB("subclass test, member is " << papernaam);

}

SharedPaper::SharedPaper(const std::string &id) : SharedSession(id) {

    DEB("paper construct " << id);
    papernaam="moi";

}
