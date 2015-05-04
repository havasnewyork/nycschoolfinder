// school-analyzer.js

var req = require('request');
var _ = require('underscore');

var hsDataUrl = "https://data.cityofnewyork.us/resource/n3p6-zve2.json";

// addl data sets to merge
var hsPerfData = "https://data.cityofnewyork.us/resource/xahu-rkwn.json";
// var hsSurveyData = "https://data.cityofnewyork.us/resource//qirg-qbv8.json"; // NOPE ITS A ZIP

var hsSATScores = "https://data.cityofnewyork.us/resource/zt9s-n5aj.json"; // from 2010


var hsSafety = "https://data.cityofnewyork.us/resource/qybk-bjjc.json";

var hsProgressRep = "https://data.cityofnewyork.us/resource/upwt-zvh3.json";
// 2012 sat https://data.cityofnewyork.us/Education/SAT-Results/f9bf-2cp4
/*


  School Name
  Number of Test Takers
  Critical Reading Mean
  Mathematics Mean
  Writing Mean

*/

var cachedResponse; // json for debugging

module.exports = function(app) {

	// app.schooldb == our clodant db instance 

	// https://data.cityofnewyork.us/resource/n3p6-zve2.json

	// request

	// app.persInsights


	function getHSData() {
		console.log('running getHSData', hsDataUrl);
		req(hsDataUrl, function (error, response, body) {
			if (error) console.log('hs data req err:', error);
			if (!error && response.statusCode == 200) {
				console.log(typeof body);
				cachedResponse = JSON.parse(body);
				// console.log(_.keys(cachedResponse));

				// 
				if (app.get('useTestDb')) {
					// limit to 100
					cachedResponse = cachedResponse.slice(0, 99);
					console.log('test - using 100 schools only');
				}
				_.each(cachedResponse, function(aSchool){
					aSchool._id = aSchool.dbn; // set cloudant doc id as the dbn for simple listing
					console.log('set cloudant id:', aSchool._id);
				});

				app.schooldb.bulk({docs: cachedResponse}, function(err, done){
					console.log('did we insert our schools?', err, done);

					if (!err) analyzeSchools();
				})
				// we should be able to use cachedResponse as a cloudant docs
				// _.each(cachedResponse, function(row) {
					// console.log(_.keys(row));
				// });
		    	// console.log(body); // Show the HTML for the Google homepage. 

		  	}
		})

	}
	
	function getHSPerformance() {
		// https://data.cityofnewyork.us/resource/xahu-rkwn.json

		// UPDATE existing records because we keyed by dbn -- 
		req(hsPerfData, function(error, response, body){
			if (error) console.log('hs perf data req err:', error);
			if (!error && response.statusCode == 200) {
				console.log(typeof body);
				var perfData = JSON.parse(body);


			}
		});
	}


	var testid = '29a48e831ddc36737daf4eace2000d06';

	function analyzeSchools() {
		console.log('must get school info and cache analysis');

		var fields = "overview_paragraph extracurricular_activities advancedplacement_courses program_highlights".split(' ');
		// cloudant each record in schools:

		// NEED ASYNC A BUNCH

		// labeling fields -- school_name boro 

		app.schooldb.list({include_docs: true}, function(err, schooldocs) {
			console.log('got single school data err?:', err);
			console.log(schooldocs.rows.length);
			_.each(schooldocs.rows, function(school){
				var schooldata = school.doc;
				// console.log('schooldata:', schooldata._id);

				var sampleText = _.pick(schooldata, fields);
				sampleText = _.values(sampleText).join('   ');
				var wc = sampleText.split(' ').length;
				
				

				if (wc < 100) {
					return console.warn(schooldata.dbn, ' - sampleText less than 100, not analyzing', wc);
				}
				console.log(schooldata.dbn, ' - sample text word count:', wc);

				app.persInsights.profile({text: sampleText}, function(err, profile){
					// console.log(schooldata.dbn, ' - any err on profile:', err);
					if (err) return console.warn('ERROR analyzing personality of school:', schooldata.dbn, err);
					schooldata.watsonPersonality = profile;
					app.schooldb.bulk({docs: [schooldata]}, function(err, updated){
						console.log(schooldata.dbn, ' - updated schooldata with watsonPersonality:', updated);
					})
					// console.log(profile.tree.children); // array of id- 'personality', 'needs', 'values'
				})

			});


			
		})



	}

	function noOp() {
		return;
	}


	return {

		// cacheData: getHSData
		// analyze: analyzeSchools
		// run: noOp
		run: getHSPerformance
	}


}




/*

'phone_number',
  'bus',
  'partner_highered',
  'school_name',
  'addtl_info1',
  'priority06',
  'priority05',
  'priority04',
  'addtl_info2',
  'priority03',
  'priority02',
  'priority01',
  'se_services',
  'school_sports',
  'city',
  'psal_sports_girls',
  'subway',
  'total_students',
  'dbn',
  'state_code',
  'partner_hospital',
  'partner_corporate',
  'building_code',
  'end_time',
  'location_1',

  "location_1": {
      "needs_recoding": false,
      "longitude": "-73.98567269099965",
      "latitude": "40.720569079000484",
      "human_address": "{\"address\":\"145 Stanton Street\",\"city\":\"New York\",\"state\":\"NY\",\"zip\":\"10002\"}"
    },

    
  'boro',
  'psal_sports_boys',
										  'program_highlights',
										  'overview_paragraph',
  'school_accessibility_description',
  'partner_cbo',
  'primary_address_line_1',
  'campus_name',
  'partner_cultural',
  'fax_number',
  'zip',
  'website',
  'partner_nonprofit',
  'number_programs',
  'grade_span_min',
  'grade_span_max',
										  'extracurricular_activities',
  'ell_programs',
										  'language_classes',
  'start_time',
										  'advancedplacement_courses'


  */





  /* 

https://data.cityofnewyork.us/resource/xahu-rkwn.json

  ontrack_year1_2013
  graduation_rate_2013
  college_career_rate_2013
  student_satisfaction_2013
  ontrack_year1_2012
  graduation_rate_2012
  college_career_rate_2012
  student_satisfaction_2012
  ontrack_year1_historic_avg_similar_schls
  graduation_rate_historic_avg_similar_schls
  college_career_rate_historic_avg_similar_schls
  student_satisfaction_historic_avg_similar_schls
  quality_review_rating
  quality_review_year


  */