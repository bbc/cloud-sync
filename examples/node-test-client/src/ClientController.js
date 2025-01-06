
// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
const SynchroniserLib = require("./Synchroniser");
const Logger = require("./logger");
const Clocks = require("dvbcss-clocks");
const VideoClock = require("./VideoClock");
const SessionInfo = require("./SessionInfo");
const Correlation = require("dvbcss-clocks").Correlation;
const WeakMap = require("weak-map");


var logger;

var PRIVATE = new WeakMap();
var THRESHOLD_SIGNIFICANT_CHANGE = .02; // 20ms

// ---------------------------------------------------------
//  ClientController class
// ---------------------------------------------------------

class ClientController{

	constructor(config, thresholdSecs)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);
		priv.thresh = thresholdSecs || THRESHOLD_SIGNIFICANT_CHANGE;
		
		priv.config = config;
		priv.sessionInfo = new SessionInfo();
        priv.sessionInfo.sessionId = config.sessionId || "default";
        priv.sessionInfo.electionAlgorithm = config.syncMode;
        priv.sessionInfo.timelineInfo = [];
		priv.sessionInfo.syncTimelineInfo = [];
		
		priv.synchroniser = null;
		priv.videoClock = null;
        priv.videoTimelineType = "tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000";
    

		logger = Logger.getNewInstance(process.env.loglevel, "clientcontroller");
		priv.logger = logger;
	}

	// ---------------------------------------------------------

	/**
	 * Starts the controller, discovers other services and listens to communications channels
	 * to receive requests.
	 */
	start()
	{
		var self = this;

		return setupController.call(self);
	}

	stop()
	{
		var priv = PRIVATE.get(this);
		
		priv.synchroniser.destroy();
		
		logger.info("Left session and stopped synchroniser.");
	}

}


// ---------------------------------------------------------
//  Callback (private) methods
// ---------------------------------------------------------

function setupController()
{
	var self = this;
	var priv = PRIVATE.get(this);

	logger.debug("connecting to sync service endpoint " + priv.config.syncURL);

	connectToSyncService.call(self); 

}

// ---------------------------------------------------------

function connectToSyncService()
{
	var self = this;
	var priv = PRIVATE.get(self);
	var endpoint;

	const  endpoint_str = priv.config.syncURL.split(":");
	if (endpoint_str.length == 2)
	{
		endpoint = { hostname: endpoint_str[0], port: endpoint_str[1]};
	}else if (endpoint_str.length == 1)
	{
		endpoint = { hostname: endpoint_str[0]};
	}

	priv.synchroniser = new SynchroniserLib.CloudSynchroniser(
       	endpoint,
        priv.config.sessionId,
        "DEFAULT",
        priv.config.deviceId,
        {
            syncTimelineElection: priv.config.syncMode
        }      
    );
    
    priv.synchroniser.on("DeviceRegistrationError", handleDeviceRegistrationError.bind(self));
    priv.synchroniser.on("DeviceRegistrationSuccess", handleDeviceRegistrationSuccess.bind(self));
    priv.synchroniser.on("WallClockUnAvailable", handleWallClockUnAvailable.bind(self));
    priv.synchroniser.on("WallClockAvailable", handleWallClockAvailable.bind(self));
    priv.synchroniser.on("SyncServiceUnavailable", handleSyncServiceUnavailable);
    priv.synchroniser.on("SyncTimelinesAvailable", handleSyncTimelinesAvailable);
}

// ---------------------------------------------------------

function scheduleStartClocks()
{
	var self = this;
	var priv = PRIVATE.get(self);
	var plan = priv.config.plan;
    for (const action of plan.actions) {
       if (action.name === "start_clock")
       {
			setTimeout(createVideoTimelineClock.bind(self), action.time_secs * 1000, action.params["contentid"],  action.params["timelinetype"]);
       }
   }
}


function createVideoTimelineClock (contentId, timelineType) {

	var self = this;
	var priv = PRIVATE.get(self);

    var videoElement = undefined;
    var videoCtrl = undefined;
    priv.sessionInfo.contentId = contentId;
    priv.sessionInfo.timelineType = timelineType;
     
    if (priv.videoClock === null) {
        priv.videoClock = new VideoClock(priv.synchroniser.wallclock, videoElement, videoCtrl);
        // priv.videoClock.on("change", function () {
		// 	var self = this;
		// 	var priv = PRIVATE.get(self);
        //    console.log("Video clock " + priv.videoClock.id +" changed");
        // }.bind(this));
   }
}

// ---------------------------------------------------------

function scheduleAllOtherJobs()
{
	var self = this;
	var priv = PRIVATE.get(self);
	var plan = priv.config.plan;
	for (const action of plan.actions) {

        switch (action.name) {
            case "publish":
				setTimeout(publishTimelineClock.bind(self), action.time_secs * 1000, action.params["contentid"],  action.params["timelinetype"]);
				break;
			case "subscribe":
				setTimeout(publishTimelineClock.bind(self), action.time_secs * 1000, action.params["contentid"],  action.params["timelinetype"]);
				break;
			case "pause":
				setTimeout(pauseTimelineClock.bind(self), action.time_secs * 1000);
				break;
			case "seek":
				setTimeout(seekTimelineClock.bind(self), action.time_secs * 1000, action.params["seek_pos"]);
					break;
			case "play":
				setTimeout(resumeTimelineClock.bind(self), action.time_secs * 1000);
					break;
			case "send_devices_query":
				setTimeout(getAvailableDevices.bind(self), action.time_secs * 1000);
					break;

			case "stop_exit":
				setTimeout(stopAndExit.bind(self), action.time_secs * 1000);
				break;
            default:
                break;
        }
    }
}

// ---------------------------------------------------------

function publishTimelineClock(contentId, timelineType) {

	var self = this;
	var priv = PRIVATE.get(self);
	console.log(">>>>>>>>>>>> Action PUBLISH video timeline.");
	console.log(priv.videoClock.speed);
	priv.synchroniser.synchronise(priv.videoClock, timelineType, contentId);
	console.log(priv.videoClock.speed);
    console.log("video timeline clock published.")
}

// ---------------------------------------------------------

function subscribeTimelineClock(contentId, timelineType) {

	var self = this;
	var priv = PRIVATE.get(self);
	console.log(">>>>>>>>>>>> Action SUBSCRIBE video timeline.");
	priv.synchroniser.synchronise(priv.videoClock, timelineType, contentId);
    console.log("video timeline clock subscribed.")
}

// ---------------------------------------------------------

function pauseTimelineClock() {

	var self = this;
	var priv = PRIVATE.get(self);
	console.log(">>>>>>>>>>>> Action PAUSE on video timeline.");
	// priv.videoClock.pauseClock();
	console.log(priv.videoClock.speed);
	updateClock.call(self, priv.videoClock.now(), 0);
	console.log(priv.videoClock.speed);
	
}

// ---------------------------------------------------------

function resumeTimelineClock() {

	var self = this;
	var priv = PRIVATE.get(self);
	console.log(">>>>>>>>>>>> Action PLAY on video timeline.")

	// priv.videoClock.pauseClock();
	console.log(priv.videoClock.speed);
	updateClock.call(self, priv.videoClock.now(), 1);
	console.log(priv.videoClock.speed);
    
}

// ---------------------------------------------------------

function seekTimelineClock(timelinePosSecs) {

	var self = this;
	var priv = PRIVATE.get(self);

	console.log(">>>>>>>>>>>> Action SEEK on video timeline to " + timelinePosSecs + "s")
	console.log(priv.videoClock.speed);
	updateClock.call(self, timelinePosSecs * priv.videoClock.tickRate, priv.videoClock.speed);
	console.log(priv.videoClock.speed);
    
}

// ---------------------------------------------------------

function updateClock (newNow, newSpeed) {
    var priv, newCorr, parentTime;
    
    priv = PRIVATE.get(this);
    parentTime = priv.synchroniser.wallclock.now();
    newCorr = new Correlation(parentTime, newNow);

    if ((priv.videoClock.isChangeSignificant(newCorr, newSpeed, priv.thresh)) || (newSpeed !== priv.videoClock.speed)){
        console.log("VideoClock:", "Setting new correlation", "(" + parentTime + ", " +  newNow + ")", "and speed", newSpeed);
        priv.videoClock.setCorrelationAndSpeed(newCorr, newSpeed);
    }
}

// ---------------------------------------------------------

function getAvailableDevices () {

	var self = this;
	var priv = PRIVATE.get(self);
	priv.logger.info("Call:  CloudSynchroniser.getAvailableDevices()");
	console.log(">>>>>>>>>>>> Action QUERY for devices in session.");

	
    priv.synchroniser.getAvailableDevices().
    then (function (devices) { 
        priv.sessionInfo.devices = devices;
    }).
	catch (function (e) { 
		console.log(error(e)); 
	});
}


function stopAndExit()
{
	this.stop();
	process.exit();
}


// ---------------------------------------------------------
//  Callback (private) methods
// ---------------------------------------------------------


function handleDeviceRegistrationSuccess () {
    logger.info("Event:", "DeviceRegistrationSuccess");
}

function handleDeviceRegistrationError (e) {
    logger.error("DeviceRegistrationError" + e);
}

function handleWallClockAvailable () {
	var self = this;
	var priv = PRIVATE.get(self);
	
	priv.logger.info("Event:", "WallClockAvailable");
    priv.logger.info("Schedule video clocks creation.");
    scheduleStartClocks.call(self);
    scheduleAllOtherJobs.call(self);
}

function handleWallClockUnAvailable () {
    logger.error("Event:", "WallClockUnAvailable");
}

function handleSyncServiceUnavailable (e) {
    logger.error("SyncServiceUnavailable", e);
}


function handleSyncTimelinesAvailable (e) {
    logger.info("SyncTimelinesAvailable", e);
}

// ---------------------------------------------------------------

// ---------------------------------------------------------

module.exports =  ClientController;