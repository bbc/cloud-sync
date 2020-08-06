
// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------

const Logger = require("./logger");
const WeakMap = require("weak-map");
const TestInfo = require("./TestInfo");
const Url = require('url');

const LOAD_TEST_TOPIC = "/cloudsync/loadtest"
const CLIENT_REFRESH_INTERVAL_MS = 5000;

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

	printTestProgress()
	{
		var priv = PRIVATE.get(this);
		priv.logger.info("Tests progress:");



	}

}


// ---------------------------------------------------------
//  Callback (private) methods
// ---------------------------------------------------------

function setUpMonitor()
{
	var self = this;
	var priv = PRIVATE.get(this);

	priv.logger.info("connecting to mqtt endpoint " + priv.config.mqttbroker);

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
		
		this.printTestProgress();

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
		// get data structure for this testcase, create one if none
		let testobj = priv.tests.get(testid);
		if ((typeof testobj === "undefined") || (testobj === null))
		{
			testobj = new TestInfo();
			priv.tests.set(testid, testobj);
		}

		// update numClients field
		if (((typeof testobj.numClients === "undefined") || (testobj.numClients === null))
			&& ((typeof msg.numClients !== "undefined") && (msg.numClients !== null))
			)
		{
			testobj.numClients =  msg.numClients;
		}

		// update checkpoints progress Map

		if ((typeof msg.checkpoint !== "undefined") && (msg.checkpoint !== null))
		{
			// record the checkpoint a client has sent message about
			// get the checkpoint object for the checkpoint
			let checkpointObj = testobj.checkpoints.get(msg.checkpoint);
			
			if (checkpointObj !== null)
			{
				// add client id to checkpoint object's client array
				if ((typeof checkpointObj.clients  === "undefined") || (checkpointObj.clients  === null))
				{
					checkpointObj.clients = new Set();
				}

				if (!checkpointObj.clients.has(msg.clientid))
				{
					checkpointObj.clients.add(msg.clientid);
					checkpointObj.lastClient = msg.clientid;
				}				
				priv.logger.info("Test " + msg.testid + ": Client " + msg.clientid + " passed checkpoint " + msg.checkpoint);
				priv.logger.info("Test " + msg.testid + ": " + checkpointObj.clients.size + " passed checkpoint " + msg.checkpoint);
			}
		}
	}
}





// ---------------------------------------------------------------

// ---------------------------------------------------------

module.exports =  LoadTestMonitor;