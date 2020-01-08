
var MessageFactory = require("../../build/lib/MessageFactory");
var Timestamp = require("../../src/common/timeline/Timestamp");
var PresentationTimestamp = require("../../src/common/timeline/PresentationTimestamp");

// ---------------------------------------------------------
//  Build a StopTimelineUpdateREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";
let timelineid = "timeline1234"
let timelineType = "urn://bbc:dvb:set"
let contentId = "http://content_url.com"

console.log("---------------------------------------------------------");
console.log("Build a TimelineUpdate message with no Presentation Timestamp");
console.log("---------------------------------------------------------");

try {
	let TLUpdate = new MessageFactory.TimelineUpdate(sessionId, deviceId, timelineid, timelineType, contentId, null);
} catch (error) {
	console.log(error);
}

console.log("---------------------------------------------------------");
console.log("Build a TimelineUpdate message with only Actual Presentation Timestamp");
console.log("---------------------------------------------------------");

let actualTS = new Timestamp(10000.001, 9999999999.001, 1 );

let pts = new PresentationTimestamp({earliest: null, actual: actualTS, latest: null});

console.log("PTS: " + JSON.stringify(pts));

let TLUpdate2 = new MessageFactory.TimelineUpdate(sessionId, deviceId, timelineid, timelineType, contentId, pts);

console.log(TLUpdate2);

let TLUpdateAsBytes2 = TLUpdate2.serialise();
console.log("TimelineUpdate serialised to binary.");

let parsedUpdate2 = MessageFactory.TimelineUpdate.deserialise(TLUpdateAsBytes2);
console.log("TimelineUpdate deserialised from binary: ");
console.log(parsedUpdate2);


console.log("---------------------------------------------------------");
console.log("Build a TimelineUpdate message with Earliest, Actual, Latest Presentation Timestamps");
console.log("---------------------------------------------------------");



let earliestTS = new Timestamp(9995.005, 9999999999.001, 2.1 );
let latestTS = new Timestamp(10005.005, 9999999999.001, 2.0 );

let pts3 = new PresentationTimestamp({earliest: earliestTS, actual: actualTS, latest: latestTS});

let TLUpdate3 = new MessageFactory.TimelineUpdate(sessionId, deviceId, timelineid, timelineType, contentId, pts3);

console.log(TLUpdate3);

let TLUpdateAsBytes3 = TLUpdate3.serialise();
console.log("TimelineUpdate serialised to binary.");

let parsedUpdate3 = MessageFactory.TimelineUpdate.deserialise(TLUpdateAsBytes3);
console.log("TimelineUpdate deserialised from binary: ");
console.log(parsedUpdate3);