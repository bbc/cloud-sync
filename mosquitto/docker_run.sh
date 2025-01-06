
#!/bin/bash
# docker run -e TESTBED_REST_API=http://192.168.86.66:8010 --name metricspusher bbcrd-reb-metricspusher

docker run \
  -p 1883:1883 \
  -p 9001:9001 \
  -v $(pwd)/config/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  --name mqttbroker \
  eclipse-mosquitto:1.6.15