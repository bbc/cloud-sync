
var MessageFactory = require("../../build/lib/MessageFactory");
var TimelineInfo = require("../../src/common/message/TimelineInfo");
var Correlation = require("../../src/common/message/Correlation");


let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";
let timelineid = "timeline1234";
let timelineType = "urn://bbc:dvb:set";
let contentId = "http://content_url.com";
let channel = "/Sessions/abc123/timeline/timeline1234/";
let frequency = 1000000000;





// ---------------------------------------------------------
//  TimelineRegistrationREQ message
// ---------------------------------------------------------

console.log("Create TimelineRegistrationREQ msg ...");

let tlregReq = new MessageFactory.TimelineRegistrationREQ(sessionId, 
													deviceId, 
													responseChannel, 
													timelineid ,
													contentId, 
													timelineType,
													frequency, 
													channel, 
													new Correlation(1000, 1000, 0.001, 0.001),
													true);
console.log(tlregReq);

let tlregReqAsBytes = tlregReq.serialise();

console.log("TimelineRegistrationREQ serialised to binary.");


let parsedTLRegREQ = MessageFactory.TimelineRegistrationREQ.deserialise(tlregReqAsBytes);

console.log("TimelineRegistrationREQ Deserialised from binary: ");
console.log(parsedTLRegREQ);


console.log(MessageFactory.Message.deserialise(tlregReqAsBytes));

// ---------------------------------------------------------
//  Respond with a TimelineRegistrationRESP message
// ---------------------------------------------------------


let  resp = new MessageFactory.TimelineRegistrationRESP(parsedTLRegREQ.sessionId, 0, "/Sessions/abc123/timeline/timeline1234/", parsedTLRegREQ.id, parsedTLRegREQ.version);

console.log(resp);

let respAsBytes =  resp.serialise();
console.log("TimelineRegistrationRESP serialised to binary.");

let parsedResp = MessageFactory.TimelineRegistrationRESP.deserialise(respAsBytes);
console.log("TimelineRegistrationRESP deserialised from binary: ");
console.log(parsedResp);


console.log(MessageFactory.Message.deserialise(respAsBytes));


// ---------------------------------------------------------
//  Build a TimelineDeregistrationREQ message
// ---------------------------------------------------------


console.log("Create TimelineDeRegistrationREQ msg ...");

let req = new MessageFactory.TimelineDeregistrationREQ(sessionId, deviceId, responseChannel, timelineid);

console.log(req);

let reqAsBytes = req.serialise();
console.log("TimelineDeRegistrationREQ serialised to binary.");


let parsedReq = MessageFactory.TimelineDeregistrationREQ.deserialise(reqAsBytes);
console.log("TimelineDeregistrationREQ Deserialised from binary: ");
console.log(parsedReq);


console.log(MessageFactory.Message.deserialise(reqAsBytes));

// ---------------------------------------------------------
//  Respond with a TimelineDeregistrationRESP message
// ---------------------------------------------------------


let  deregresp = new MessageFactory.TimelineDeregistrationRESP(parsedReq.sessionId, 0, parsedReq.id, parsedReq.version);

console.log(deregresp);

let deregrespAsBytes =  deregresp.serialise();
console.log("TimelineDeregistrationRESP serialised to binary.");

let parsedDeregResp = MessageFactory.TimelineDeregistrationRESP.deserialise(deregrespAsBytes);
console.log("Join RESP Deserialised from binary: ");
console.log(parsedDeregResp);


console.log(MessageFactory.Message.deserialise(deregrespAsBytes));