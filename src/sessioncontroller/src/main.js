/****************************************************************************
/* FILE:                main.js                            				*/
/* DESCRIPTION:         Session Controller service 		                 */
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
//  Imports
// ---------------------------------------------------------
var commandLineArgs = require("command-line-args");
var SessionController = require("./sessioncontrollerimpl");
const Logger = require("./logger");
const url = require("url");
const dns = require("dns");
const dnsPromises = dns.promises;



// ---------------------------------------------------------
//  Local state
// ---------------------------------------------------------
var sController; 	// session controller

/**
 * names of services to use for service lookup (partial matching supported)
 */
var config = {
	wallclockservice_ws: { name: "wallclock-service", port: 6676 },
	wallclockservice_udp: { name: "wallclock-service", port: 6677 },
	mqttbroker: { name: "mqttbroker", port: 1883 },
	redis: { name: "redis"}
};

config.currentDir =  process.env.SRC_DIR || process.cwd();

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
//  Service discovery 
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
//  Start controller
// ---------------------------------------------------------

// ---------------------------------------------------------

/**
 * 
 * @param {object} services service endpoints See services object definition.
 */
async function setUpController(services, logger)
{
	try {
		sController = new SessionController(services, config);
		await sController.start();
		logger.info("Session Controller started. ");
	} catch (error) {
		logger.error(error);
	}
}

// ---------------------------------------------------------

async function main()
{
	var logger;
	var optionDefinitions = [
		{ name: "keepalive", alias: "k", type: Number, defaultValue: 10000 },
		{ name: "retries", alias: "r", type: Number, defaultValue: 20 },
		{ name: "loglevel", alias: "l", type: String, defaultValue: "development" }
	];

	try {
		var options = commandLineArgs(optionDefinitions);
		logger = Logger.getNewInstance(options.loglevel, "sessioncontroller");

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
			
		setUpController(services, logger);
		// CRTL-C handler
		process.on("SIGINT", function() {
			sController.stop();
			process.exit();
		});

		
	} catch (e) {
		logger.error(e);
	}
}


main();



