/****************************************************************************
/* FILE:                StatsController.js                					*/
/* DESCRIPTION:         API to query running stats for cloud-sync service  	*/
/* VERSION:             (see git)                                       	*/
/* DATE:                (see git)                                       	*/
/* AUTHOR:              Rajiv Ramdhany <rajiv.ramdhany@bbc.co.uk>    		*/

/* Copyright 2015 British Broadcasting Corporation							*/

/* Unless required by applicable law or agreed to in writing, software		*/
/* distributed under the License is distributed on an "AS IS" BASIS,		*/
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.	*/
/* See the License for the specific language governing permissions and		*/
/* limitations under the License.											*/
/****************************************************************************/
"use strict";


// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
var redis = require("redis");
var RedisConnection = require("../../common/datastore/redisconnection");  
const Device = require("../../common/state/Device");
const Session = require("../../common/state/Session");
const List = require("../../common/state/List");
const SyncTLElection = require("../../common/state/SyncTLElection");
var Logger = require("./logger");
var RedisSMQConfig = require("../../common/events/RedisSMQConfig");
const redisSMQ = require("redis-smq");
const Consumer = redisSMQ.Consumer;
const uuidv4 = require("uuid/v4");
const osutils = require("os-utils");

const {InfluxDB, Point, HttpError} = require("@influxdata/influxdb-client");
const {url, token, org, bucket, username, password} = require("./env");
const {hostname} = require("os");
const PahoMQTT = require("paho-mqtt");


var PRIVATE = new WeakMap();
var logger;


// ---------------------------------------------------------
//  Constants
// ---------------------------------------------------------

// const kSyncControllerQueueKey = "cloudsync_synccontroller_waitQueue";
const SESSIONS_LIST_KEY = "cloud_sync_sessions";


// ---------------------------------------------------------
//  Class
// ---------------------------------------------------------
/**
 * @class StatsController
 * 
 * @classdesc A service stats controller * 
 * @constructor
 * @param {object} config config  
 * @param {object} config.redis
 * @param {string} config.redis.host
 * @param {number} config.redis.port
 * @param {object} config.log
 * @param {(boolean|number)} config.log.enabled
 * @param {object} config.log.config
 * @param {object} config.monitor
 * @param {(boolean|number)} config.monitor.enabled
 * @param {string} config.monitor.host
 * @param {number} config.monitor.port
 * @param {number} config.messageConsumeTimeout
 * @param {number} config.messageTTL
 * @param {number} config.messageRetryThreshold
 	
 */
class StatsController 
{

	constructor(services, config)
	{
		// super(new RedisSMQConfig(services.redis.host, services.redis.port, config.monitor.host, config.monitor.port).getConfig(),
		// 	{messageConsumeTimeout : config.messageConsumeTimeout}
		// );
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		// service endpoints
		priv.config = config;
		priv.serverName = process.env["CLOUD_SYNC_INSTANCE_NAME"] || hostname();
		priv.wallclockservice_udp = services.wallclockservice_udp;
		priv.wallclockservice_ws = services.wallclockservice_ws;
		priv.mosquitto = services.mqttbroker;
		priv.redis = services.redis;
	
		
		this.id = "statscontroller_" + uuidv4();
		this.queueName = config.SyncControllerQueueName;		
		logger = Logger.getNewInstance(process.env.loglevel, "statscontroller");		

		priv.redisClient = RedisConnection("DEFAULT", priv.redis);
		priv.redisClient.on("error", function (err) {
			logger.error("Redis connection Error : " + err);
		});
		logger.info("connected to Redis endpoint " + JSON.stringify(config.redis));

		priv.ENABLE_STATS_WRITE = process.env["ENABLE_INFLUX_DB_WRITE"] === "ON" ? true : false;
		console.log( priv.ENABLE_STATS_WRITE);
		console.log( process.env);
		if (priv.ENABLE_STATS_WRITE)
		{
			logger.info("creating InfluxDBClient");
			priv.writeApi = new InfluxDB({url, token, username, password}).getWriteApi(org, bucket);
			console.log(priv.writeApi);
			if ((typeof priv.writeApi !== "undefined" ) && (priv.writeApi!==null))
			{
				logger.info("connected to InfluxDB.");
				// setup default tags for all writes through this API
				priv.writeApi.useDefaultTags({server: priv.serverName});

				const point1 = new Point('temperature')
				.tag('example', 'write.ts')
				.floatField('value', 20 + Math.round(100 * Math.random()) / 10);
				priv.writeApi.writePoint(point1);
				console.log(` ${point1}`);
			}
		}

		// priv.mqttClient = new Paho.MQTT.Client(host, port, user);

	}


	start()
	{

	}

	// ---------------------------------------------------------
	/**
	 * Returns get number of sessions as a Promise
	 */
	getSessionsCountAsync()
	{
		let self = this;
		let priv = PRIVATE.get(self);
		let ds = priv.redisClient;
		let sessionsList = List(SESSIONS_LIST_KEY, ds);

		return sessionsList.count();
	}

	getAllSessionsInfoAsync()
	{
		let self = this;
		let priv = PRIVATE.get(self);
		let ds = priv.redisClient;
		let sessionsList = List(SESSIONS_LIST_KEY, ds);

		let minIndex = 0;
		let maxIndex = -1;

		let sessionsInfo={};

		return new Promise((resolve, reject) =>{
			sessionsList.getAllInRange(minIndex, maxIndex).then((sessionArray)=>{
				var promises = [];
				for (let sessionKey of sessionArray)
				{
					if (typeof sessionKey === "string"){
						var p = self.getSessionInfoAsync(sessionKey);
						promises.push(p);
					}
				}
				return Promise.all(promises);
			}).then((sessionInfoArray)=>{
				sessionsInfo.session_count = sessionInfoArray.length;
				sessionsInfo.sessions = sessionInfoArray;
				// return osutils.cpuUsage()
				resolve(sessionsInfo);			
			}).catch((result)=>{reject(result);});
		});
	}


	getSessionInfoAsync(sessionKey)
	{	
		let session_info={};
		session_info.device_count = 0;
		session_info.devices = [];
		session_info.synctimelines = [];
		let self = this;
		let priv = PRIVATE.get(self);
		let ds = priv.redisClient;

		let sessionobj;
		
		return new Promise((resolve, reject) =>{
			
			Session.deserialise(sessionKey, ds).then((session)=>{
				session_info.session_id = session.id;
				sessionobj = session;
				return session.getDevices();
			}).then((devicesArray)=>{
				session_info.device_count =  devicesArray.length;
				for (const device of devicesArray) {
					session_info.devices.push(device.id);					
				}
				
				return sessionobj.getSyncTimelines();
			}).then((synctimelines)=>{
				for (const t of synctimelines) {
					session_info.synctimelines.push(t.getInfo());
					session_info.createdOn = t.createdOn.toISOString();
				}
				resolve(session_info);
			}).catch((result)=>{reject(result);});
		});	
	}

	// get number of devices in session
	getDevicesInSessionCountAsync()
	{

	}

	// get number of WS connections to Mosquitto MQTT broker


	// get number of jobs in redis-smq queue and average job wait times



	

} // end of class definition

// ---------------------------------------------------------
//  Private methods
// ---------------------------------------------------------

function writeMQTTBrokerStats()
{
	let self = this;
	let priv = PRIVATE.get(self);


}


/**
 * Callback method for mqtt client
 * @param {pbject} serviceEndpoint 
 */
function handleAdapterConnected (serviceEndpoint) {
	logger.info("Connected to mqtt broker:", serviceEndpoint.host + ":" + serviceEndpoint.port);
}

// ---------------------------------------------------------
/**
 * Callback method for mqtt client
 * @param {object} error 
 */
function handleAdapterConnectionFailure (error) {
	logger.error(error);

}



// ---------------------------------------------------------
// Utility methods
// ---------------------------------------------------------





module.exports = StatsController;
