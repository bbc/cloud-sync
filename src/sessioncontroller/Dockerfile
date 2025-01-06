FROM node:12.22.12

LABEL version="2.0.0"
LABEL description="This service provide session management functions to the Sync Service and handles \
requests from clients"

# Create service directory
RUN mkdir -p /usr/src/common
WORKDIR /usr/src/common
ADD common/ /usr/src/common
COPY package.json /usr/src/common
RUN npm install

WORKDIR /usr/src
RUN mkdir -p /usr/src/sessioncontroller

RUN npm install grunt-cli -g


RUN mkdir -p /usr/src/sessioncontroller/src
WORKDIR /usr/src/sessioncontroller/src
ADD sessioncontroller/src /usr/src/sessioncontroller/src

WORKDIR /usr/src/sessioncontroller
COPY sessioncontroller/Gruntfile.js /usr/src/sessioncontroller/

# Install service dependencies
COPY sessioncontroller/package.json /usr/src/sessioncontroller/
RUN npm install
RUN grunt build_lib

EXPOSE 4002

CMD [ "npm", "start" ]

