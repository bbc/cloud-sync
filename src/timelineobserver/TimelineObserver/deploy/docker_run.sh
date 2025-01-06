#!/bin/bash
docker run -e SERVICE_NAME=timelineobserver --name sessioncontroller bbcrd-cloudsync-timelineobserver -d redis -b mqttbroker -t Sessions/+/timelines/+/state