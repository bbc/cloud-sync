FROM node:12.22.12

LABEL version="2.0.0"
LABEL description="This service provide run-time usage and performance stats via its REST API"

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

