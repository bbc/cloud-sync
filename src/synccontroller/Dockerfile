FROM node:12.22.12

LABEL version="2.0.0"
LABEL description="This service provides monitors timeline membership change events in a session and generates a synchronisation \
timeline for each timeline source-type pair. It dynamically runs a reduction function over the state of similar timelines to \
synthesise the state for the synchronisation timeline."


# Create service directory
RUN mkdir -p /usr/src/common
WORKDIR /usr/src/common
ADD common/ /usr/src/common
COPY package.json /usr/src/common
RUN npm install

WORKDIR /usr/src
RUN mkdir -p /usr/src/synccontroller

RUN npm install grunt-cli -g


RUN mkdir -p /usr/src/synccontroller/src
WORKDIR /usr/src/synccontroller/src
ADD synccontroller/src /usr/src/synccontroller/src

WORKDIR /usr/src/synccontroller
COPY synccontroller/Gruntfile.js /usr/src/synccontroller/

# Install service dependencies
COPY synccontroller/package.json /usr/src/synccontroller/
RUN npm install
RUN grunt build_lib

EXPOSE 3002

CMD [ "npm", "start" ]

