## Demo

Alpha version is running at: http://internet-paper.com/


## Installing

### Building on Ubuntu 20.

NOTE: We require at least g++-10.

Install requirements as root:

```console
#  apt install g++-10 cmake libboost-dev libboost-thread-dev libboost-regex-dev libboost-filesystem-dev libssl-dev libz-dev

```

As user
```console
etherpaint@internetpapier:~/etherpaint$ cd apps/etherpaint/
etherpaint@internetpapier:~/etherpaint/apps/etherpaint$ mkdir build
etherpaint@internetpapier:~/etherpaint/apps/etherpaint$ cd build
etherpaint@internetpapier:~/etherpaint/apps/etherpaint/build$ export CXX=/usr/bin/g++-10 
etherpaint@internetpapier:~/etherpaint/apps/etherpaint/build$ export CC=/usr/bin/gcc-10 
etherpaint@internetpapier:~/etherpaint/apps/etherpaint/build$ cmake ..
etherpaint@internetpapier:~/etherpaint/apps/etherpaint/build$ make
(will clone/build everything thats needed)
...
[ 88%] Linking CXX executable paper
[100%] Built target paper
```


