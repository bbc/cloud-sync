
var MessageFactory = require("../../build/lib/MessageFactory");

function toArrayBuffer(buffer) {
	var ab = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(ab);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}
// ---------------------------------------------------------
//  Build a JoinREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/jason_iphone";
let requestChannel = "Sessions/abc123/jason_iphone";
let syncStrategy = 2;


console.log("Create JoinREQ msg ...");
let join_req = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);

console.log(join_req);

let joinREQByteArray = join_req.serialise();
console.log("JoinREQ serialised to binary.");


let parsedJoinReq = MessageFactory.JoinREQ.deserialise(joinREQByteArray);
console.log("JoinREQ Deserialised from binary: ");
console.log(parsedJoinReq);


console.log(MessageFactory.Message.deserialise(joinREQByteArray));

// ---------------------------------------------------------
//  Respond with a JoinRESP message
// ---------------------------------------------------------


let join_resp = new MessageFactory.JoinRESP(parsedJoinReq.sessionId, 0, "ws://192.168.1.225:6676", parsedJoinReq.id, parsedJoinReq.version);

console.log(join_resp);

let joinRESPByteArray = join_resp.serialise();
console.log("JoinRESP serialised to binary.");

let parsedJoinResp = MessageFactory.JoinRESP.deserialise(joinRESPByteArray);
console.log("Join RESP Deserialised from binary: ");
console.log(parsedJoinResp);


console.log(MessageFactory.Message.deserialise(joinRESPByteArray));