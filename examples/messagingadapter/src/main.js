
var  MessagingAdapter = require("../../../src/common/messenger/messagingadapter/MqttMessagingAdapter"),
	MessageFactory =require("../../../build/lib/MessageFactory"),
	MessageIdGenerator = require("../../../src/common/message/MessageIdGenerator");

var Buffer = require('buffer').Buffer;

// var Messenger = require("../build/lib/Messenger");

var sessionId = "123";
var deviceId = "abc";
var brokerHost = "192.168.1.70";
var brokerport = 1883;
var version = "0.0.1";


var msgEndpoint = new MessagingAdapter(brokerHost, brokerport, deviceId, sessionId);

msgEndpoint.on("connectionestablished", ()=>{
	console.log("connected.");

	msgEndpoint.listen("mychannel");
	
	console.log("send message");
	
	msgEndpoint.on("message", onMessageArrived.bind(this));
	
	msgEndpoint.on("response", onResponseArrived.bind(this));
	msgEndpoint.on("requesterror", onRequestError.bind(this));

	// msgEndpoint.send("test123", "mychannel");

	// joinSession();
	let sessionId = "abc123";
	let deviceId = "rajivr_iphone";
	let responseChannel = "test_channel";
	let requestChannel = "test_channel";
	let syncStrategy = 2;

	console.log("Create JoinREQ msg ...");
	let join_req = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);
	let join_req_bytes = join_req.serialise();
	console.log(join_req_bytes);
	msgEndpoint.send(Buffer.from(join_req_bytes), "mychannel");
	// msgEndpoint.send(join_req_bytes, "mychannel");

});

msgEndpoint.on("connectionfailure", ()=>{
	console.log("connection failure.");
});


msgEndpoint.on("connectionlost", ()=>{
	console.log("connectionlost.");
});

function onMessageArrived (msg) {
	console.log("Received message: ");
	console.log(msg.length);

	// var typedarray = new Uint8Array(msg);

	var parsedmsg = MessageFactory.Message.deserialise(msg);
	// console.log("Received message with id:" +  msg.id);

	console.log(parsedmsg);
}


function onResponseArrived (msg) {
	console.log("Received response: " + msg);

}


function onRequestError (msgId) {
	console.log("Request Error for request with id :" +  msgId);
}


function joinSession () {
    
	var joinRequest;

	let sessionId = "abc123";
	let deviceId = "rajivr_iphone";
	let responseChannel = "Sessions/abc123/jason_iphone";
	let requestChannel = "Sessions/abc123/jason_iphone";
	let syncStrategy = 2;

	console.log("Create JoinREQ msg ...");
	let join_req = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);
	// joinRequest = MessageFactory.create(
	// 	"JoinREQ",
	// 	sessionId,
	// 	deviceId,
	// 	MessageIdGenerator.getNewId(),
	// 	version
	// );

	var request = joinRequest.serialise();

	var options = {retry: true, retryTimes: 5, retryDelay: 1};
	msgEndpoint.sendRequest(request, sessionId, options);
}


