//
// Created by psy on 25-08-20.
//

#ifndef messages_SHAREDPAPER_H
#define messages_SHAREDPAPER_H


#include "messages/SharedSession.h"

class SharedPaper : public SharedSession {
public:
    void test() override;

    SharedPaper(const std::string &id);
    std::string papernaam;

void paperding()
{
  DEB("paperding called: " << papernaam);
};

};


#endif //messages_SHAREDPAPER_H
