
var MessageFactory = require("../../build/lib/MessageFactory");

// ---------------------------------------------------------
//  Build a ContentIdChange message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";


console.log("Create ContentIdChange msg ...");

let msgObj = new MessageFactory.ContentIdChange(sessionId, deviceId, "https://content_url");

console.log(msgObj);

let msgBytes = msgObj.serialise();
console.log("ContentIdChange serialised to binary.");


let parsedRequest = MessageFactory.ContentIdChange.deserialise(msgBytes);
console.log("ContentIdChange deserialised from binary: ");
console.log(parsedRequest);


console.log(MessageFactory.Message.deserialise(msgBytes));

