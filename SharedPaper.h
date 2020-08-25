//
// Created by psy on 25-08-20.
//

#ifndef RESTBED_TEST_SHAREDPAPER_H
#define RESTBED_TEST_SHAREDPAPER_H


#include "SharedSession.h"

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


#endif //RESTBED_TEST_SHAREDPAPER_H
