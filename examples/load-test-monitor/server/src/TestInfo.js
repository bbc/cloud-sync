var TestInfo = function () {
    this.testid = undefined;
    this.numClients = undefined;
    this.checkpoints = new Map();
};

module.exports = TestInfo;


// {
//     tests: [ {
//         testId: "",
//         numClients: 100,
//         checkpoints: { "checkpoint1" : { clients:Set, lastclient: "234234"}},
//     }]
// }