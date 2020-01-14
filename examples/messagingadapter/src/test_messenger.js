
var  MessagingAdapter = require("../../../src/common/messenger/messagingadapter/MqttMessagingAdapter"),
MessageIdGenerator = require("../../../src/common/message/MessageIdGenerator");

var Messenger = require("../../../build/lib/Messenger");
var MessageFactory = require("../../../build/lib/MessageFactory");

// var Messenger = require("../../../src/common/messenger/Messenger");
// var MessageFactory = require("../../../src/common/message/Message");


var brokerHost = "192.168.1.70";
var brokerport = 1883;

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "test_channel";
let requestChannel = "test_channel";
let syncStrategy = 2;


var msgAdapter = new MessagingAdapter(brokerHost, brokerport, deviceId, { sessionId : sessionId});

msgAdapter.on("connectionestablished", ()=>{
console.log("connected.");


});

msgAdapter.on("connectionfailure", ()=>{
	console.log("Failed to connect to MQTT broker.");	
});

msgAdapter.on("connectionlost", ()=>{
	console.log("connectionlost.");
	});

var messenger = messenger = new Messenger(msgAdapter);

messenger.on("request", handleIncomingRequest.bind(this));
messenger.on("message", handleIncomingMessage.bind(this));
messenger.on("response", handleIncomingResponse.bind(this));
messenger.listen(requestChannel);

joinSession();


function handleIncomingRequest(msg)
{
	console.log("request received: " + JSON.stringify(msg));
}

function handleIncomingMessage(msg)
{
	console.log("message received.");
}

function onMessageArrived (msg) {
console.log("Received message: " + msg);
// 	msg = MessageFactory.deserialise(msg);
// 	console.log("Received message with id:" +  msg.id);
}


function handleIncomingResponse (msg) {
console.log("Received response: " + msg);
// msg = MessageFactory.deserialise(msg);
// console.log("Received response with id:" +  msg.id);
}

function joinSession () 
{

var joinRequest;

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "test_channel";
let requestChannel = "test_channel";
let syncStrategy = 2;

console.log("Create JoinREQ msg ...");
let join_req = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);


// var request = join_req.serialise();

var options = {retry: true, retryTimes: 5, retryDelay: 1};
console.log("Send JoinREQ msg ...");
// messenger.send(Buffer.from(request), requestChannel);
messenger.send(join_req, requestChannel);
}


