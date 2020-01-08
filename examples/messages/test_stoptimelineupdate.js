
var MessageFactory = require("../../build/lib/MessageFactory");

// ---------------------------------------------------------
//  Build a StopTimelineUpdateREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";


console.log("Create StopTimelineUpdateREQ msg ...");

let stopReq = new MessageFactory.StopTimelineUpdateREQ(sessionId, deviceId, responseChannel, "some_timeline_id", "urn://timelinetype", "https://content_url");

console.log(stopReq);

let requestByteArray = stopReq.serialise();
console.log("StopTimelineUpdateREQ serialised to binary.");


let parsedRequest = MessageFactory.StopTimelineUpdateREQ.deserialise(requestByteArray);
console.log("StopTimelineUpdateREQ deserialised from binary: ");
console.log(parsedRequest);


console.log(MessageFactory.Message.deserialise(requestByteArray));

