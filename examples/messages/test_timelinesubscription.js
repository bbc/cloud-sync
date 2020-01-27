
var MessageFactory = require("../../src/common/message/Message");
var TimelineInfo = require("../../src/common/message/TimelineInfo");
var Timestamp = require("../../src/common/timeline/Timestamp");
var Correlation = require("../../src/common/message/Correlation");
var PresentationTimestamp = require("../../src/common/timeline/PresentationTimestamp");

// ---------------------------------------------------------
//  Build a TimelineSubscriptionREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";
let timelineid = "timeline1234"
let timelineType = "urn://bbc:dvb:set"
let contentId = "http://content_url.com"
let channel = "/Sessions/abc123/timeline/timeline1234/"

console.log("---------------------------------------------------------");
console.log("Create TimelineSubscriptionREQ msg");
console.log("---------------------------------------------------------");

let request= new MessageFactory.TimelineSubscriptionREQ(sessionId, deviceId, responseChannel, timelineid);

console.log(request);

let requestAsBytes = request.serialise();
console.log("TimelineSubscriptionREQ serialised to binary.");


let parsedReq = MessageFactory.TimelineSubscriptionREQ.deserialise(requestAsBytes);
console.log("TimelineSubscriptionREQ Deserialised from binary: ");
console.log(parsedReq);


console.log(MessageFactory.Message.deserialise(requestAsBytes));



// ---------------------------------------------------------
//  Build a TimelineSubscriptionRESP message
// ---------------------------------------------------------



console.log("---------------------------------------------------------");
console.log("Build a TimelineSubscriptionRESP message with only Actual Presentation Timestamp");
console.log("---------------------------------------------------------");

let actualTS = new Timestamp(10000.001, 9999999999.001, 1 );
let pts = new PresentationTimestamp(null, actualTS, null);

let parentTimelineId = "urn:wallclock";
let parentCorr = new Correlation(1000, 10000, 0.5, 0.0001);
let lastTimestamp =  new Timestamp(10000.001, 9999999999.001, 1 );

console.log("PTS: " + JSON.stringify(pts));

const timeline = new TimelineInfo("timeline1" 
								, timelineType
								, contentId
								, 1000000000
								, "Sessions/" + sessionId + "/timelines/timeline1/"
								, "device123"
								, "phone"
								, parentTimelineId
								, parentCorr
								,lastTimestamp);



let TLSubResp2 = new MessageFactory.TimelineSubscriptionRESP(parsedReq.sessionId, 0, timeline ,parsedReq.id, parsedReq.version);

console.log(TLSubResp2);

let TLSubRespAsBytes2 = TLSubResp2.serialise();
console.log("TimelineSubscriptionRESP serialised to binary.");

let parsedRESP2 = MessageFactory.TimelineSubscriptionRESP.deserialise(TLSubRespAsBytes2);
console.log("TimelineSubscriptionRESP deserialised from binary: ");
console.log(parsedRESP2);


// console.log("---------------------------------------------------------");
// console.log("Build a TimelineSubscriptionRESP message with Earliest, Actual, Latest Presentation Timestamps");
// console.log("---------------------------------------------------------");



// let earliestTS = new Timestamp(9995.005, 9999999999.001, 2.1 );
// let latestTS = new Timestamp(10005.005, 9999999999.001, 2.0 );

// let pts3 = new PresentationTimestamp(earliestTS, actualTS, latestTS);

// console.log("PTS3: " + JSON.stringify(pts3));

// let TLSubResp3 = new MessageFactory.TimelineSubscriptionRESP(parsedReq.sessionId, 0, channel, pts3 ,parsedReq.id, parsedReq.version);

// console.log(TLSubResp3);

// let TLSubRespAsBytes3 = TLSubResp3.serialise();
// console.log("TimelineSubscriptionRESP serialised to binary.");

// let parsedRESP3 = MessageFactory.TimelineSubscriptionRESP.deserialise(TLSubRespAsBytes3);
// console.log("TimelineSubscriptionRESP deserialised from binary: ");
// console.log(parsedRESP3);