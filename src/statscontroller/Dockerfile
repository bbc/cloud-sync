FROM node:8
MAINTAINER Rajiv Ramdhany "rajiv.ramdhany@bbc.co.uk"

LABEL version="2.0.0"
LABEL description="This service provide run-time usage and performance stats via its REST API"

# update npm to v5.3.0
RUN rm -rf /usr/local/lib/node_modules/npm \
  && mkdir /usr/local/lib/node_modules/npm \
  && curl -sL https://github.com/npm/npm/archive/v5.3.0.tar.gz | tar xz -C /usr/local/lib/node_modules/npm --strip-components=1 \
  && npm --version


# Create service directory
RUN mkdir -p /usr/src/common
WORKDIR /usr/src/common
ADD common/ /usr/src/common
COPY package.json /usr/src/common
RUN npm install

WORKDIR /usr/src
RUN mkdir -p /usr/src/statscontroller

RUN npm install grunt-cli -g


RUN mkdir -p /usr/src/statscontroller/src
WORKDIR /usr/src/statscontroller/src
ADD statscontroller/src /usr/src/statscontroller/src

WORKDIR /usr/src/statscontroller
COPY statscontroller/Gruntfile.js /usr/src/statscontroller/

# Install service dependencies
COPY statscontroller/package.json /usr/src/statscontroller/
RUN npm install


EXPOSE 4001 5855

CMD [ "npm", "start" ]

