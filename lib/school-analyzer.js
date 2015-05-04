// school-analyzer.js

var req = require('request');


var hsDataUrl = "https://data.cityofnewyork.us/resource/n3p6-zve2.json";


module.exports = function(app) {

	// app.schooldb == our clodant db instance 

	// https://data.cityofnewyork.us/resource/n3p6-zve2.json

	// request

	// app.persInsights


	function getHSData() {

		req(hsDataUrl, function (error, response, body) {
			if (error) console.log('hs data req err:', error);
			if (!error && response.statusCode == 200) {
				console.log(typeof body);
		    	console.log(body); // Show the HTML for the Google homepage. 

		  	}
		})

	}



	return {
		run: getHSData
	}


}

