var TestInfo = function () {
    this.testid = undefined;
    this.numclients = undefined;
    this.checkpoints = [];
    this.checkpointProgressMap = new Map();
};

module.exports = TestInfo;


{
    tests: [ {
        testId: "",
        numClients: 100,
        checkpoints: [],
        testProgress: [
            {checkpoint: "check1",  numCompleted: 1} , 
            {checkpoint: "check1",  numCompleted: 1} 
        ]
    }]
}