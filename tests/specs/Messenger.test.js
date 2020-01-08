var Messenger, MockMessagingAdapter, m1, r1, c1, 
    responseHandler, timeoutHandler;

MockMessagingAdapter = require("MockMessagingAdapter");
MessageFactory = require("../../build/lib/MessageFactory");
Messenger = require("../../build/lib/Messenger");

let sessionId = "abc123";
let deviceId = "rajivr_iphone";
let responseChannel = "Sessions/abc123/jason_iphone";
let requestChannel = "Sessions/abc123/jason_iphone";
let syncStrategy = 2;

m1 = new MessageFactory.JoinREQ(sessionId, deviceId, responseChannel, requestChannel, syncStrategy); 

r1 = new MessageFactory.JoinRESP(m1.sessionId, 0, "ws://192.168.1.225:6676", m1.id, m1.version);
c1 = responseChannel;

describe ("Messenger", function () {

    beforeEach (function () {
        responseHandler = jasmine.createSpy("responseHandler");
        timeoutHandler = jasmine.createSpy("timeoutHandler");
        jasmine.clock().install();
    });

    afterEach (function () {
        jasmine.clock().uninstall();
    });

    it ("MockMessagingAdapter Exists", function () {
        expect(MockMessagingAdapter).toBeDefined();
    });

    it ("MessageFactory Exists", function () {
        expect(MessageFactory).toBeDefined();
    });

    it ("Messenger Exists", function () {
        expect(Messenger).toBeDefined();
    });
    it ("sendRequest: Receives a response to a request", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 200);
        messenger = new Messenger(adapter);
        
        messenger.sendRequest(m1, c1, responseHandler, { onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(201);
        expect(responseHandler).toHaveBeenCalledWith(jasmine.objectContaining({
            sessionId: r1.sessionId,
            id: m1.id,
            wallclockUrl:"ws://192.168.1.225:6676"
        }));
        expect(timeoutHandler).not.toHaveBeenCalled();
    });

    it ("sendRequest: Receives a response after timeout and first retry", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 1500);
        messenger = new Messenger(adapter);

        messenger.sendRequest(m1, c1, responseHandler, { maxRetry: 1, onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1200);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1501);
        expect(responseHandler).toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();
    });

    it ("sendRequest: Cancels request after max number of retry attempts", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 5000);
        messenger = new Messenger(adapter);

        messenger.sendRequest(m1, c1, responseHandler, { maxRetry: 1, onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1001);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1000);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler.calls.count()).toEqual(0);

        jasmine.clock().tick(2000);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler.calls.count()).toEqual(1);

        console.log(timeoutHandler.calls.argsFor(0));
    });

});