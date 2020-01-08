var MessageFactory;

MessageFactory = require("../../build/lib/MessageFactory");
var Correlation = require("Correlation");

var sessionId = "abc123";
var deviceId = "rajivr_iphone";
var responseChannel = "Sessions/abc123/jason_iphone";
var requestChannel = "Sessions/abc123/jason_iphone";
var syncStrategy = 2;

var timelineid = "timeline1234";
var timelineType = "urn://bbc:dvb:set";
var frequency = 1000000000;
var contentId = "http://content_url.com";
var channel = "/Sessions/abc123/timeline/timeline1234/";
var tlRegREQSerialised;



describe("MessageFactory", function () {

    it("Exists", function () {
        expect(MessageFactory).toBeDefined();
        expect(MessageFactory.JoinREQ).toBeDefined();
        expect(MessageFactory.JoinRESP).toBeDefined();
        expect(MessageFactory.TimelineRegistrationREQ).toBeDefined();
        expect(Correlation).toBeDefined();
    });

    it("Creates a JoinREQ message", function () {
        var msg = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);;
        expect(msg instanceof MessageFactory.JoinREQ).toBe(true);
        expect(msg.sessionId).toEqual(sessionId);
        expect(msg.id).toBeDefined();
        console.log(msg.id);
    });

    it("Creates a JoinREQ message and serialises it to bytes", function () {
    
        var msg = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);
        var protoMsgBytesArray =  msg.serialise();

        expect(protoMsgBytesArray.length).toBeGreaterThan(0);
    });

    it("Deserialises a JoinREQ message from bytes", function () {
    
        var msg = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);;
        var protoMsgBytesArray =  msg.serialise();
        var parsedJoinReq = MessageFactory.Message.deserialise(protoMsgBytesArray);
        // console.log("JoinREQ Deserialised from binary: ");
        console.log(JSON.stringify(parsedJoinReq));
        expect(parsedJoinReq.senderId).toEqual(deviceId);
    });

    it("Throws error if create message with invalid parameters", function () {
        var fun = function () {
            return new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel);
        };
        expect(fun).toThrow();
    });


    it("Creates a TimelineRegistrationREQ message and serialises it to bytes", function () {
        
        // constructor(sessionId, senderId, responseChannel, timelineId, contentId, timelineType, frequency, channel, correlation, useForSessionSync, msgId, version)
        var msg = new MessageFactory.TimelineRegistrationREQ(sessionId, 
                                                            deviceId, 
                                                            responseChannel, 
                                                            timelineid ,
                                                            contentId, 
                                                            timelineType, 
                                                            frequency,
                                                            channel, 
                                                            null, 
                                                            true);

        
        expect(msg instanceof MessageFactory.TimelineRegistrationREQ).toBe(true);

        tlRegREQSerialised =  msg.serialise();

        expect(tlRegREQSerialised.length).toBeGreaterThan(0);
    });

    // it("Deserialises a JoinREQ message from bytes", function () {
    
    //     var msg = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy);;
    //     var protoMsgBytesArray =  msg.serialise();
    //     var parsedJoinReq = MessageFactory.Message.deserialise(protoMsgBytesArray);
    //     // console.log("JoinREQ Deserialised from binary: ");
    //     console.log(JSON.stringify(parsedJoinReq));
    //     expect(parsedJoinReq.senderId).toEqual(deviceId);
    // });


//     // it("Throws error if to deserialise message with invalid parameters", function () {
//     //     var fun = function () {
//     //         return MessageFactory.deserialise('{"type":"JoinREQ","sesnId":"ses1","deviId":"dvc1","i":"msg1","veron":"v1"}');
//     //     };
//     //     expect(fun).toThrow();
//     // });

//     // it("Throws error if to create message of unknown type", function () {
//     //     var fun = function () {
//     //         return MessageFactory.create("Join", "ses1", "ctx1", "dvc1", "msg1", "0.0.1");
//     //     };
//     //     expect(fun).toThrow();
//     // });

//     // it("Throws error if to deserialise message of unknown type", function () {
//     //     var fun = function () {
//     //         return MessageFactory.deserialise('{"type":"Join","sessionId":"ses1","contextId":"ctx1","deviceId":"dvc1","id":"msg1","version":"v1"}');
//     //     };
//     //     expect(fun).toThrow();
//     // });

});