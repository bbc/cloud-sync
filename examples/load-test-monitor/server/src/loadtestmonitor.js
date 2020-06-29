
// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

const Logger = require("./logger");
const WeakMap = require("weak-map");
const TestInfo = require("./TestInfo");
const Url = require('url');

const LOAD_TEST_TOPIC = "/cloudsync/loadtest"
const CLIENT_REFRESH_INTERVAL_MS = 250;

var PRIVATE = new WeakMap();

// ---------------------------------------------------------
//  LoadTestMonitor class
// ---------------------------------------------------------

class LoadTestMonitor{

	constructor(config)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
		
		priv.config = config;
		priv.tests = new WeakMap();
	
		priv.logger = Logger.getNewInstance(process.env.loglevel, "LoadTestMonitor");
	}

	// ---------------------------------------------------------

	/**
	 * Starts the controller, discovers other services and listens to communications channels
	 * to receive requests.
	 */
	start()
	{
		var self = this;

		return setUpMonitor.call(self);
	}

	stop()
	{
		var priv = PRIVATE.get(this);
		priv.logger.info("Stopped LoadTestMonitor.");
	}

}


// ---------------------------------------------------------
//  Callback (private) methods
// ---------------------------------------------------------

function setUpMonitor()
{
	var self = this;
	var priv = PRIVATE.get(this);

	priv.logger.debug("connecting to mqtt endpoint " + priv.config.mqttbroker + ":" + priv.config.mqttport);

	connectToMQTTBroker.call(self); 





}

// ---------------------------------------------------------

function connectToMQTTBroker()
{
	var self = this;
	var priv = PRIVATE.get(self);
	var host, port;

	const  endpoint_url = Url.parse(priv.config.mqttbroker);

    if (typeof endpoint_url.port !== "undefined"){
        priv.client = mqtt.connect({ host: endpoint_url.host, port: endpoint_url.port, keepalive: 60, clientId: "loadtestmonitor"});
    }else
    {
        priv.client = mqtt.connect( endpoint_url,  { keepalive: 60, clientId: "loadtestmonitor" });
    }

   
    priv.client.on("connect", onConnect.bind(this));
    priv.client.on("error", onError.bind(this));
    priv.client.on("close", onClose.bind(this));
    priv.client.on("message", handleMessage.bind(this));

}

// ---------------------------------------------------------


function stopAndExit()
{
	this.stop();
	process.exit();
}


// ---------------------------------------------------------
//  Callback (private) methods
// ---------------------------------------------------------


function onConnect () {
	
	var self = this;
	var priv = PRIVATE.get(self);

	priv.logger.info("Event:", "Connected to MQTT broker");
	priv.client.subscribe(LOAD_TEST_TOPIC);

	priv.senderTimer = setTimeout(() => {
		
		let testStatsObj =  


	}, CLIENT_REFRESH_INTERVAL_MS);

}

function onError (e) {
	var self = this;
	var priv = PRIVATE.get(self);
    priv.logger.error("MQTT Error" + e);
}

function onClose () {
	
	var self = this;
	var priv = PRIVATE.get(self);
	
    priv.logger.info("MQTT connection closed.");
}

/**
 * Handle message from load test clients
 * @param {string} topic 
 * @param {string} message JSON string
 */
function handleMessage (topic, message) {

	var self = this;
	var priv = PRIVATE.get(self);
	// priv.logger.error("Event:", "WallClockUnAvailable");

	let msg = JSON.parse(message);
	let testid = msg.testid;

	if ((typeof testid !== "undefined") && (testid !== null))
	{
		let testobj = priv.tests.get(testid);
		if ((typeof testobj === "undefined") || (testobj === null))
		{
			testobj = new TestInfo();
			priv.tests.set(testid, testobj);
		}

		if (((typeof testobj.numclients === "undefined") || (testobj.numclients === null))
			&& ((typeof msg.numclients !== "undefined") && (msg.numclients !== null))
			)
		{
			testobj.numclients =  msg.numclients;
		}

		if ((testobj.checkpoints.length === 0)
			&& ((typeof msg.checkpoints !== "undefined") && (msg.checkpoints !== null))
			)
		{
			testobj.checkpoints = Array.from(msg.checkpoints);
		}

		// now process the checkpoint notification
		if ((typeof message.checkpoint !== "undefined") || (message.checkpoint !== null))
		{
			if (!testobj.checkpoints.includes(message.checkpoint))
			{
				testobj.checkpoints.push(message.checkpoint);
			}

			if  (!testobj.checkpointProgressMap.has(message.checkpoint))
			{
				testobj.checkpointProgressMap.set(message.checkpoint, 0);
			}
			let val = testobj.checkpointProgressMap.get(message.checkpoint);
			val++;		
		} 
	}
}



// ---------------------------------------------------------------

// ---------------------------------------------------------

module.exports =  LoadTestMonitor;