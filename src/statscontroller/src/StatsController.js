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
const mqtt = require("mqtt");


var PRIVATE = new WeakMap();
var logger;


// ---------------------------------------------------------
//  Constants
// ---------------------------------------------------------

// const kSyncControllerQueueKey = "cloudsync_synccontroller_waitQueue";
const SESSIONS_LIST_KEY = "cloud_sync_sessions";

const Mosquitto_SYS_Topics = [
	{ topic: "$SYS/broker/bytes/received", 		description : "The total number of bytes received since the broker started."},
	{ topic: "$SYS/broker/bytes/sent",			description : "The total number of bytes sent since the broker started."},
	{ topic: "$SYS/broker/clients/connected", 	description : "TThe number of currently connected clients."},
	{ topic: "$SYS/broker/clients/disconnected", description : "The total number of persistent clients registered at the broker but are currently disconnected"},
	{ topic: "$SYS/broker/clients/maximum", 		description : "The maximum number of clients connected simultaneously since the broker started"},
	{ topic: "$SYS/broker/messages/received", 		description : "The total number of messages received since the broker started."},
	{ topic: "$SYS/broker/messages/sent", 		description : "The total number of PUBLISH messages sent since the broker started."},
	{ topic: "$SYS/broker/publish/messages/dropped", 		description : "The total number of PUBLISH messages that have been dropped due to inflight/queuing limits."},
	{ topic: "$SYS/broker/uptime", 		description : "The total number of seconds since the broker started."},
	{ topic: "$SYS/broker/clients/total", 		description : "The total number of clients connected since the broker started."},
	{ topic: "$SYS/broker/load/connections/5min", 		description : "moving average of the number of CONNECT packets received by the broker over 5min"},
	{ topic: "$SYS/broker/load/messages/received/5min", 		description : "The moving average of the number of all types of MQTT messages received by the broker over 5min"},
	{ topic: "$SYS/broker/load/messages/sent/5min", 		description : "moving average of the number of all types of MQTT messages sent by the broker over 5min"},
	{ topic: "$SYS/broker/load/publish/dropped/5min", 		description : "moving average of the number of publish messages dropped by the broker over 5min"}
];


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

		// console.log( process.env);
		if (priv.ENABLE_STATS_WRITE)
		{
			logger.info("creating InfluxDBClient");
			priv.writeApi = new InfluxDB({url, token, username, password}).getWriteApi(org, bucket);

			if ((typeof priv.writeApi !== "undefined" ) && (priv.writeApi!==null))
			{
				logger.info("connected to InfluxDB.");
				// setup default tags for all writes through this API
				priv.writeApi.useDefaultTags({server: priv.serverName});

			}

			priv.STATS_INTERVAL = 1*60*1000;
			priv.statsTimers = [];
		}
	}


	start()
	{
		let self = this;
		let priv = PRIVATE.get(self);

		// connect the client
		var user = priv.serverName + "_statscontroller";

		if (typeof priv.mosquitto.port !== "undefined"){
			priv.mqttClient = mqtt.connect({ host: priv.mosquitto.host, port: priv.mosquitto.port, keepalive: 60, clientId: user});
		}else
		{
			var mqtt_url = "ws://" + priv.mosquitto.host;
			priv.mqttClient = mqtt.connect( mqtt_url,  { keepalive: 60, clientId: user});
		}
		   
		priv.mqttClient.on("connect", onConnect.bind(this));
		priv.mqttClient.on("error", onConnectionFailure.bind(this));
		priv.mqttClient.on("close", onConnectionLost.bind(this));
		priv.mqttClient.on("message", onMessageArrived.bind(this));


		const intervalObj = setInterval(writeSessionInfo.bind(this), priv.STATS_INTERVAL);
		priv.statsTimers.push(intervalObj);
	}


	stop()
	{
		let self = this;
		let priv = PRIVATE.get(self);
		console.log("stopping statscontroller ....");
		priv.mqttClient.end();
		console.log("unsubcribing from mqtt topics.")


		for (const t of priv.statsTimers) {
			clearInterval(t);
		}

		priv.writeApi
			.close()
			.then(() => {
				console.log('FINISHED ')
			})
			.catch(e => {
				console.error(e);
				if (e instanceof HttpError && e.statusCode === 401) {
					console.log(e);
				}
				console.log('\nFinished ERROR');
			});
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

	// get total number of devices in session
	getDevicesInSessionCountAsync()
	{
		// not implemented
		throw "not implemented";
	}

	// get number of jobs in redis-smq queue and average job wait times


} // end of class definition

// ---------------------------------------------------------
//  Private methods
// ---------------------------------------------------------

function writeSessionInfo()
{
	let self = this;
	let priv = PRIVATE.get(self);

	var sessionsCountPoint, sessionDevicesCountPoint, totalDevicesCountPoint;

	self.getAllSessionsInfoAsync().then((sessionsInfo)=>{
		let total_devices = 0;

		if ((typeof sessionsInfo.session_count !== "undefined") && 
			(sessionsInfo.session_count !== null))
		{
			sessionsCountPoint = new Point('sessions_now')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'statscontroller')
				.intField("sessions", sessionsInfo.session_count);
			priv.writeApi.writePoint(sessionsCountPoint);

			for (const session of sessionsInfo.sessions) {
				
				total_devices += session.device_count;

				sessionDevicesCountPoint = new Point('session_metrics')
					.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
					.tag('SERVICE_NAME', 'statscontroller')
					.tag("ENTITY", "session")
					.stringField("sessionId", session.session_id)
					.stringField("createdOn", session.createdOn)
					.intField("devices", session.device_count);
				priv.writeApi.writePoint(sessionDevicesCountPoint);
			}
		}

		totalDevicesCountPoint = new Point('devices_now')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'statscontroller')
				.intField("devices", total_devices);
			priv.writeApi.writePoint(totalDevicesCountPoint);

	}).catch((error)=>
	{
		console.log(error);
	});

	


	
}



// ---------------------------------------------------------

// called when the client connects
function onConnect(connack) {
	let self = this;
	let priv = PRIVATE.get(self);
	// Once a connection has been made, subscribe to $SYS topics 
	logger.info("Connected to mqtt broker:", priv.mosquitto.host + ":" + priv.mosquitto.port);

	priv.mqttClient.subscribe("$SYS/#");

  }
  
  // called when the client loses its connection
  function onConnectionFailure(error) {
	
	  logger.error("onConnectionFailure:" + error);
	
  }
  
  // called when the client loses its connection
  function onConnectionLost() {
	logger.error("connection to mqtt broker lost.");
  }
  
  // called when a message arrives
  function onMessageArrived(topic, message) {
	let self = this;
	let priv = PRIVATE.get(self);

	let value = message.toString();
	var mpoint;

	switch (topic) {
		case  "$SYS/broker/bytes/received":
			mpoint = new Point('bytes_received')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("bytes", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/bytes/sent":
			mpoint = new Point('bytes_sent')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("bytes", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/clients/connected":
			mpoint = new Point('clients_connected')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("clients", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/clients/disconnected":
			mpoint = new Point('clients_disconnected')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("clients", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/clients/maximum":
			mpoint = new Point('clients_maximum')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("clients", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/messages/received":
			mpoint = new Point('msgs_received')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("msgs", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case  "$SYS/broker/messages/sent":
			mpoint = new Point('msgs_sent')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("msgs", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/publish/messages/dropped":
			mpoint = new Point('msgs_dropped')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("msgs", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/clients/total":
			mpoint = new Point('clients_total')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("clients", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/load/connections/5min":
			mpoint = new Point('connections_avg_5min')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("average", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/load/messages/received/5min":
			mpoint = new Point('msgs_received_avg_5min')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("average", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/load/messages/sent/5min":
			mpoint = new Point('msgs_sent_avg_5min')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("average", value)
			priv.writeApi.writePoint(mpoint);
			break;
		case "$SYS/broker/load/publish/dropped/5min":
			mpoint = new Point('msgs_dropped_avg_5min')
				.tag('CLOUD_SYNC_INSTANCE', priv.serverName)
				.tag('SERVICE_NAME', 'mqttbroker')
				.intField("average", value)
			priv.writeApi.writePoint(mpoint);
			break;
		default:
			break;
	}
  }
  
  

// ---------------------------------------------------------
// Utility methods
// ---------------------------------------------------------





module.exports = StatsController;
