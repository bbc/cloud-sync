
var MessageFactory = require("../../build/lib/MessageFactory");
var TimelineInfo = require("../../src/common/message/TimelineInfo");
var Correlation = require("../../src/common/message/Correlation");
var Timestamp = require("../../src/common/timeline/Timestamp");



// ---------------------------------------------------------
//  Build a SyncTimelinesAvailable message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";
let timelineid = "timeline1234"
let timelineType = "urn://bbc:dvb:set"
let contentId = "http://content_url.com"
let channel = "/Sessions/abc123/timeline/timeline1234/"
let frequency = 1000000000;
let parentTimelineId = "urn:wallclock";
let parentCorr = new Correlation(1000, 10000, 0.5, 0.0001);
let lastTimestamp =  new Timestamp(10000.001, 9999999999.001, 1 );

console.log("---------------------------------------------------------");
console.log("Build a SyncTimelinesAvailable message ");
console.log("---------------------------------------------------------");



// create a list of timelines
let timelines = [];

for (let i = 0; i < 5; i++) {
	const obj = new TimelineInfo("timeline" + i
								, timelineType
								, contentId
								, 1000000000
								, "Sessions/" + sessionId + "/timelines/timeline" + i + "/"
								, "device123"
								, "phone"
								, parentTimelineId
								, parentCorr
								,lastTimestamp);
	timelines.push(obj);	
}

let syncTLAvailMsg = new MessageFactory.SyncTimelinesAvailable(sessionId, timelines);

console.log(syncTLAvailMsg);

let syncTLAvailMsgAsBytes = syncTLAvailMsg.serialise();
console.log("SyncTimelinesAvailable serialised to binary.");


let parsedMsg = MessageFactory.SyncTimelinesAvailable.deserialise(syncTLAvailMsgAsBytes);
console.log("SyncTimelinesAvailable Deserialised from binary: ");
console.log(JSON.stringify(parsedMsg));


console.log(MessageFactory.Message.deserialise(syncTLAvailMsgAsBytes));




// console.log("---------------------------------------------------------");
// console.log("Build a TimelineRESP message with 0 timelines");
// console.log("---------------------------------------------------------");

// let queryResp2 = new MessageFactory.TimelineRESP(parsedMsg.sessionId, 0, [] ,  parsedMsg.id, parsedMsg.version);

// console.log(queryResp2);

// let queryRespAsBytes2 = queryResp2.serialise();
// console.log("TimelineRESP serialised to binary.");

// let parsedRESP2 = MessageFactory.TimelineRESP.deserialise(queryRespAsBytes2);
// console.log("TimelineRESP deserialised from binary: ");
// console.log(parsedRESP2);


// console.log(MessageFactory.Message.deserialise(queryRespAsBytes2));