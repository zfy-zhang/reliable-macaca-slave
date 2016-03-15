# reliable-slave Deployment Guide

## Requirements

First of all, in order to run iOS apps, the reliable-slave can only be installed on a mac.Then you need to install both the iOS and Android Dev Environment to run the test.

run command to check environment:

```shell
$ npm i macaca-client -g
$ macaca doctor
```

## Installation

You need to install Node.js before.

And before install reliable-slave, you need to install the zeromq library first.

```shell
$ brew install pkg-config
$ brew install zeromq

# Then

$ npm install reliable-slave -g
```

After enviroment checking and installation, it is ready to deploy the reliable-slave.

## Deployment

Before deploy the reliable-slave, there should be a reliable-master server running already, if there wasn't, you should deploy the [reliable-master](http://github.com/macacajs/reliable-master) first. After the reliable-master server is running, we could use command to deploy reliable-slave.

### For Development:

```shell
$ reliable server -m <reliable-master:port> --verbose
```
After initialization successfully. Server logs will be shown in your terminal.
