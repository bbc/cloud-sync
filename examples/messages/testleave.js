
var MessageFactory = require("../../build/lib/MessageFactory");


// ---------------------------------------------------------
//  Build a LeaveREQ message
// ---------------------------------------------------------

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/rajivr_iphone";
let requestChannel = "Sessions/abc123/rajivr_iphone";


console.log("Create LeaveREQ msg ...");

let leave_req = new MessageFactory.LeaveREQ(sessionId, deviceId, responseChannel);

console.log(leave_req);

let leaveREQByteArray = leave_req.serialise();
console.log("LeaveREQ serialised to binary.");


let parsedLeaveReq = MessageFactory.LeaveREQ.deserialise(leaveREQByteArray);
console.log("LeaveREQ Deserialised from binary: ");
console.log(parsedLeaveReq);


console.log(MessageFactory.Message.deserialise(leaveREQByteArray));

// ---------------------------------------------------------
//  Respond with a LeaveRESP message
// ---------------------------------------------------------


let  leave_resp = new MessageFactory.LeaveRESP(parsedLeaveReq.sessionId, 0, parsedLeaveReq.id, parsedLeaveReq.version);

console.log(leave_resp);

let LeaveRESPByteArray =  leave_resp.serialise();
console.log("LeaveRESP serialised to binary.");

let parsedLeaveRESP = MessageFactory.LeaveRESP.deserialise(LeaveRESPByteArray);
console.log("Join RESP Deserialised from binary: ");
console.log(parsedLeaveRESP);


console.log(MessageFactory.Message.deserialise(LeaveRESPByteArray));