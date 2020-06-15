const readline = require('readline');
const fs = require('fs');

const readInterface = readline.createInterface({
    input: fs.createReadStream('sessions_week3.txt'),
    // output: process.stdout,
    console: false
});

var count = 0;
var prev_value=0, current_value =0;
var increment = 0;
var sessions_count = 0;
readInterface.on('line', function(line) {
	
	if (line !== ""){
		current_value = line;
		increment = current_value - prev_value;
		
		if (increment > 0)
		{
			sessions_count +=increment;
		} 
		prev_value = current_value;
		console.log("Increment: " + increment +  " sessions_count: " + sessions_count);
	}

	
});