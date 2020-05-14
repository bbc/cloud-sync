
// ---------------------------------------------------------
//  Declarations
// ---------------------------------------------------------
const SynchroniserLib = require("./Synchroniser");
const Logger = require("./logger");
const Clocks = require("dvbcss-clocks");
const VideoClock = require("./VideoClock");
const SessionInfo = require("./SessionInfo");

var logger;

var PRIVATE = new WeakMap();

// ---------------------------------------------------------
//  ClientController class
// ---------------------------------------------------------

class ClientController{

	constructor(config)
	{
		PRIVATE.set(this,{});
		var priv = PRIVATE.get(this);

		
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
		// priv.messenger.stopListenAll();
		// priv.messenger.disconnect();
		// if (typeof priv.syncCrtlQProducer !== "undefined")
		// {
		// 	priv.syncCrtlQProducer.shutdown();
		// }
		
		logger.info("stopped listening to channels");
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

	priv.synchroniser = new SynchroniserLib.CloudSynchroniser(
        { hostname: priv.config.syncURL},
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
        
            default:
                break;
        }
    }
}


function publishTimelineClock(contentId, timelineType) {

	var self = this;
	var priv = PRIVATE.get(self);

    priv.synchroniser.synchronise(priv.videoClock, timelineType, contentId);
    console.log("video timeline clock published.")
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