var VideoClock, CorrelatedClock, WeakMap, PRIVATE, THRESHOLD_SIGNIFICANT_CHANGE;

CorrelatedClock = require("dvbcss-clocks").CorrelatedClock;
Correlation = require("dvbcss-clocks").Correlation;
WeakMap = require("weak-map");


PRIVATE = new WeakMap();
THRESHOLD_SIGNIFICANT_CHANGE = .02; // 20ms


VideoClock = function (parentClock, videoElement, thresholdSecs) {
    var priv, videoClock, self;

    self = this;

    videoClock = new CorrelatedClock(parentClock, {
        correlation: new Correlation({
            parentTime: parentClock.now(),
            childTime: 0.0
        })
    });
    
    PRIVATE.set(this, {
        clock: videoClock,
        video: videoElement,
        parent: parentClock,
        thresh: thresholdSecs || THRESHOLD_SIGNIFICANT_CHANGE
    });

    return videoClock;
};

VideoClock.prototype.pauseClock =  function  () {
    var priv = PRIVATE.get(this);
    // console.log("VideoClock: Handle media PAUSE");
    console.log("%c User caused PAUSE of video clock", "background-color:green; color: white;");
    updateClock.call(this, priv.clock.now(), 0);
}

VideoClock.prototype.resumeClock  = function  () {
    var priv = PRIVATE.get(this);
    // console.log("VideoClock: Handle media PLAY");
    console.log("%c User caused RESUME of video clock", "background-color:green; color: white;");
    updateClock.call(this, priv.clock.now(), 1);
}

VideoClock.prototype.seekClock = function  (seekamount) {
    var priv = PRIVATE.get(this);
    if (seekamount >= 0) {
        // console.log("VideoClock: Handle media SEEK to position", priv.video.currentTime);
        console.log("%c User caused SEEK of video clock" + " by " + seekamount + "s", "background-color:green; color: white;");

        var newNow = priv.clock.now() + (seekamount *  priv.clock.tickRate);

        updateClock.call(this, newNow, priv.clock.speed);
    }
}

function updateClock (newNow, newSpeed) {
    var priv, newCorr, parentTime;
    
    priv = PRIVATE.get(this);
    parentTime = priv.parent.now();
    newCorr = new Correlation(parentTime, newNow);

    if (priv.clock.isChangeSignificant(newCorr, newSpeed, priv.thresh)) {
        console.log("VideoClock:", "Setting new correltation", "(" + parentTime + ", " +  newNow + ")", "and speed", newSpeed);
        priv.clock.setCorrelationAndSpeed(newCorr, newSpeed);
    }
}

module.exports = VideoClock;