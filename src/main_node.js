/**
 * @module synckit-cloud
 * @description
 *  Server library for a cloud-based media synchronisation service
 *
 * <p>This is the top level module that you should "require":
 * @example
 * var synchroniser = require("synckit-cloud");
 */


// var createSynchroniser = require("./client/CloudSyncKit");
// var WallClockSynchroniser = require("./client/WallClockSynchroniser");
//var MessageFactory = require("./common/message/MessageFactory");

module.exports = {
    
    CloudSynchroniser: require("./client/CloudSynchroniser"),
//     WallClockSynchroniser: WallClockSynchroniser,
// },
// Messages: {
//     MessageFactory : MessageFactory,
    SyncTLElection: require("./common/state/SyncTLElection")


};
