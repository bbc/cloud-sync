
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
//  Build a DeviceREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";


console.log("Create DeviceREQ msg ...");
let device_req = new MessageFactory.DeviceREQ(sessionId, deviceId, responseChannel);

let deviceREQByteArray = device_req.serialise();
console.log("DeviceREQ serialised to binary.");


let parsedDeviceReq = MessageFactory.DeviceREQ.deserialise(deviceREQByteArray);
console.log("DeviceREQ Deserialised from binary: ");
console.log(parsedDeviceReq);


console.log(MessageFactory.Message.deserialise(deviceREQByteArray));

// ---------------------------------------------------------
//  Respond with a DeviceRESP message
// ---------------------------------------------------------


let device_resp = new MessageFactory.DeviceRESP(parsedDeviceReq.sessionId, 0, ["device123" , "device345"] ,  parsedDeviceReq.id, parsedDeviceReq.version);

// console.log(device_resp);

let DeviceRESPByteArray = device_resp.serialise();
console.log("DeviceRESP serialised to binary.");

let parsedDeviceRESP = MessageFactory.DeviceRESP.deserialise(DeviceRESPByteArray);
console.log("Join RESP Deserialised from binary: ");
console.log(parsedDeviceRESP);


console.log(MessageFactory.Message.deserialise(DeviceRESPByteArray));