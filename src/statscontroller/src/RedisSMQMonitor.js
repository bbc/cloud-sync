'use strict';

const redis = require('redis');
const IORedis = require('ioredis');



function redisClient(config, cb) {
    const { redis: redisParams = {} } = config;
    let driver = 'redis';
    let driverOptions = {};
    if (redisParams.driver) {
        driver = redisParams.driver;
        if (redisParams.options) driverOptions = redisParams.options;
    } else driverOptions = redisParams;
    const client = (driver === 'ioredis') ? new IORedis(driverOptions)
        : redis.createClient(driverOptions);
    client.on('ready', () => {
        cb(client);
    });
}

/**
 *
 * @param {object} config
 * @return {object}
 */
function RedisSMQStats(config = {}) {


    // const { host = '0.0.0.0', port = 7210, socketOpts = {} } = config.monitor;
    return {
        /**
         *
         * @param {function} cb
         */
        listen(cb) {

            redisClient(config, (client) => {
                console.log(`Successfully connected to RedisSMQ server.`);
                client.subscribe('stats');
                client.on('message', (channel, message) => {
					const json = JSON.parse(message);
					// console.log(message);
				});
				cb && cb();
            });
        },
    };
}

module.exports = RedisSMQStats;
