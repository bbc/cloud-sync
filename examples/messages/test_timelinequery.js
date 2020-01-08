
var MessageFactory = require("../../build/lib/MessageFactory");
var TimelineInfo = require("../../src/common/message/TimelineInfo");



// ---------------------------------------------------------
//  Build a TimelineREQ message
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
console.log("Build a TimelineREQ message ");
console.log("---------------------------------------------------------");

let queryReq= new MessageFactory.TimelineREQ(sessionId, deviceId, responseChannel, true);

console.log(queryReq);

let queryAsBytes = queryReq.serialise();
console.log("TimelineREQ serialised to binary.");


let parsedReq = MessageFactory.TimelineREQ.deserialise(queryAsBytes);
console.log("TimelineREQ Deserialised from binary: ");
console.log(parsedReq);


console.log(MessageFactory.Message.deserialise(queryAsBytes));

console.log("---------------------------------------------------------");
console.log("Build a TimelineQuery message ");
console.log("---------------------------------------------------------");

let timelinequery = new MessageFactory.TimelineQuery(sessionId, deviceId, responseChannel, null, contentId, timelineType, false);

console.log(timelinequery);

let timelinequeryBytes = timelinequery.serialise();
console.log("TimelineQuery serialised to binary.");

let parsedQuery = MessageFactory.TimelineQuery.deserialise(timelinequeryBytes);
console.log("TimelineQuery Deserialised from binary: ");
console.log(parsedQuery);


console.log(MessageFactory.Message.deserialise(timelinequeryBytes));




console.log("---------------------------------------------------------");
console.log("Build a TimelineRESP message with timelines");
console.log("---------------------------------------------------------");


// create a list of timelines
let timelines = [];

for (let i = 0; i < 5; i++) {
	const obj = new TimelineInfo("timeline" + i, timelineType, contentId, 1000000000, "Sessions/" + sessionId + "/timelines/timeline" + i + "/", "device123", "phone");
	timelines.push(obj);	
}

let queryResp = new MessageFactory.TimelineRESP(parsedReq.sessionId, 0, timelines ,  parsedReq.id, parsedReq.version);

console.log(queryResp);

let queryRespAsBytes = queryResp.serialise();
console.log("TimelineRESP serialised to binary.");

let parsedRESP = MessageFactory.TimelineRESP.deserialise(queryRespAsBytes);
console.log("TimelineRESP deserialised from binary: ");
console.log(parsedRESP);


console.log(MessageFactory.Message.deserialise(queryRespAsBytes));



console.log("---------------------------------------------------------");
console.log("Build a TimelineRESP message with 0 timelines");
console.log("---------------------------------------------------------");

let queryResp2 = new MessageFactory.TimelineRESP(parsedReq.sessionId, 0, [] ,  parsedReq.id, parsedReq.version);

console.log(queryResp2);

let queryRespAsBytes2 = queryResp2.serialise();
console.log("TimelineRESP serialised to binary.");

let parsedRESP2 = MessageFactory.TimelineRESP.deserialise(queryRespAsBytes2);
console.log("TimelineRESP deserialised from binary: ");
console.log(parsedRESP2);


console.log(MessageFactory.Message.deserialise(queryRespAsBytes2));