/****************************************************************************
/* FILE:                main.js                								*/
/* DESCRIPTION:         Sync Controller service					 	        */
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


// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
var commandLineArgs = require("command-line-args");
var StatsController = require("./StatsController");
const Logger = require("./logger");
const url = require("url");
const dns = require("dns");
const dnsPromises = dns.promises;
const express = require("express");
const app = express();

const basicAuth = require('express-basic-auth');
 
app.use(basicAuth({
	users: { 'statsviewer': 'w4llcl0ck$4sync' },
	challenge: true,
    realm: 'Imb4T3st4pp'
}));




const kSyncControllerQueueKey = "cloudsync_synccontroller_waitQueue";
const kredisQMonitorPort = 3002;

// ---------------------------------------------------------
//  Local state
// ---------------------------------------------------------

var statscontroller;
var server;
var logger;

/**
 * names of services to use for service lookup (partial matching supported)
 */
var config = {
	wallclockservice_ws: { name: "wallclock-service", port: 6676 },
	wallclockservice_udp: { name: "wallclock-service", port: 6677 },
	mqttbroker: { name: "mqttbroker", port: 1883 },
	redis: { name: "redis"},
	SyncControllerQueueName: kSyncControllerQueueKey, 
	monitor: {
		enabled: true,
		host: "127.0.0.1",
		port: kredisQMonitorPort,
	},
	messageConsumeTimeout :2000
};

const dns_options = {
  family: 4,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

/**
 * Discovered service endpoints of the type {host: <address>, port: <integer>}
 */
var services = {
	wallclockservice_udp: undefined,
	wallclockservice_ws: undefined,
	mqttbroker: undefined,
	redis: undefined
};


// ---------------------------------------------------------


// ---------------------------------------------------------
//   Service discovery 
// ---------------------------------------------------------

async function retryDnsLookup(hostname, options = {}) {
    const { retries = 50, delay = 500 } = options;

    for (let i = 0; i < retries; i++) {
      try {
        const result = await dnsPromises.lookup(hostname, dns_options);
        return result;
      } catch (error) {
        if (i < retries - 1) {
          console.warn(`DNS lookup failed for ${hostname} (attempt ${i + 1}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Rethrow the error after all retries have failed
        }
      }
    }
}

async function serviceHostLookUp(serviceName, options = {})
{
	return retryDnsLookup(serviceName, options);
}


// ---------------------------------------------------------
//  Start
// ---------------------------------------------------------

// ---------------------------------------------------------


function setUpWebAPI()
{
	app.set("port", 4001);

	app.get("/stats", (req, resp) => {

		statscontroller.getSessionsCountAsync().then((count)=>{
			
			var obj = { sessions : count};
			
			resp.send(JSON.stringify(obj));
		})

	});

	app.get("/stats/all", (req, resp) => {

		statscontroller.getAllSessionsInfoAsync().then((result)=>{
			logger.info(JSON.stringify(result));
			resp.send(JSON.stringify(result));
		})

	});

	server = app.listen(app.get("port"), function() {
		logger.info("'Stats' app server running at port " + server.address().port);
	});



}

async function main()
{
	var optionDefinitions = [
		{ name: "loglevel", alias: "l", type: String, defaultValue: "development" }
	];
	
	try {
		var options = commandLineArgs(optionDefinitions);
		logger = Logger.getNewInstance(options.loglevel, "statscontroller");
	
		// config
		config.loglevel = options.loglevel;
		process.env.loglevel = options.loglevel;
	
		
		// discover local Wallclock service
		const wallclockservice = await serviceHostLookUp(config.wallclockservice_ws.name, {retries:  50, delay: 500});
		services.wallclockservice_ws = {host: wallclockservice.address, port:config.wallclockservice_ws.port};
		services.wallclockservice_udp = {host: wallclockservice.address, port:config.wallclockservice_udp.port};
		logger.info("Discovered Wallclock Service " + JSON.stringify(services.wallclockservice_ws));
	
		// discover MQTT Broker 
		const mqttbroker = await serviceHostLookUp(config.mqttbroker.name, {retries:  50, delay: 500});
		services.mqttbroker = {host: mqttbroker.address, port:config.mqttbroker.port};
		logger.info("Discovered mqttbroker service " + JSON.stringify(services.mqttbroker));
	
		// discover Redis service
		const redis = await serviceHostLookUp(config.redis.name, {retries:  50, delay: 500});
		services.redis = {host: redis.address, port:config.redis.port};
		logger.info("Discovered redis service " + JSON.stringify(services.redis));
	
		statscontroller = new StatsController(services, config);
		statscontroller.start();
	
		setUpWebAPI();
	
		// CRTL-C handler
		process.on("SIGINT", function() {
			statscontroller.stop();
			process.exit();
		});
	} catch (e) {
		logger.error(e);
	}
}

main();





