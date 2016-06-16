# Dockerizing reliable-macaca-slave

FROM reliable-base-docker

MAINTAINER xudafeng@126.com

WORKDIR /

COPY . /reliable-macaca-slave

WORKDIR /reliable-macaca-slave

RUN npm install --registry=https://registry.npm.taobao.org
