
/*  Copyright 2008,2009,2010 Edwin Eefting (edwin@datux.nl)

    This file is part of Synapse.

    Synapse is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Synapse is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Synapse.  If not, see <http://www.gnu.org/licenses/>. */

#ifndef CEXCEPTION_H
#define CEXCEPTION_H

#include <stdexcept>
#include <string>
#include <execinfo.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

class program_error : public std::runtime_error
{
private:
    std::string mTrace;

public:

    program_error(const std::string &err)
        : std::runtime_error(err)
    {
#ifdef NDEBUG
        mTrace = "Please enable debugging to get exception stack traces.";
#else
        int j, nptrs;
        const int buffer_size = 100;
        void *buffer[buffer_size];
        char **strings;

        nptrs = backtrace(buffer, buffer_size);

        strings = backtrace_symbols(buffer, nptrs);
        if (strings == NULL)
        {
            mTrace = "Error while getting backtrace.";
            return;
        }

        for (j = 0; j < nptrs; j++)
        {
            mTrace += strings[j];
            mTrace += "\n";
        }

        free(strings);

#endif
    }

    const char *getTrace() const throw()
    {
        return (mTrace.c_str());
    }
};

#endif
