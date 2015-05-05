// school-analyzer.js

var req = require('request');
var _ = require('underscore');
var async = require('async');

// our primary data source
var hsDataUrl = "https://data.cityofnewyork.us/resource/n3p6-zve2.json";

var cityBaseUrl = "https://data.cityofnewyork.us/resource/"; // + code + ".json"
var mergeData = {
	performance: 	"xahu-rkwn",
	sat: 			"zt9s-n5aj",
	safety: 		"qybk-bjjc",
	progress: 		"upwt-zvh3"
}

// addl data sets to merge
// var hsPerfData = "https://data.cityofnewyork.us/resource/xahu-rkwn.json";
// var hsSurveyData = "https://data.cityofnewyork.us/resource//qirg-qbv8.json"; // NOPE ITS A ZIP

// var hsSATScores = "https://data.cityofnewyork.us/resource/zt9s-n5aj.json"; // from 2010


// var hsSafety = "https://data.cityofnewyork.us/resource/qybk-bjjc.json";

// var hsProgressRep = "https://data.cityofnewyork.us/resource/upwt-zvh3.json";

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
	

	function fetchDataSet(code, dataset, callback) {
		console.log('executing fetchDataSet:', code, dataset);
		var dataUrl = cityBaseUrl + code + ".json";
		var ret = {};

		req(dataUrl, function(error, response, body){
			if (error) return callback(error);
			if (!error && response.statusCode == 200) {
				console.log(typeof body);
				// var perfData = JSON.parse(body);
				ret[dataset] = JSON.parse(body); // label our data sets so our async callback knows what is what
				callback(null, ret);

			}
		});

	}


	function mergeDataSets(dataSets) {
		// an array of objects, first key is our key to use for the merge, include all matching by pk of 'dbn' on our 

		app.schooldb.list({include_docs: true}, function(err, schooldocs) {

			// schooldocs.rows _.indexBy('dbn') then turn back to array for the bulk update
			if (err) return console.warn('got cloudant error listing schooldb:', err);
			console.log('got school count:', schooldocs.rows.length);
			console.log(schooldocs);
			var docIndex = _.indexBy(schooldocs.rows, 'id'); // this is what we are merging on by the data set key
			// { id: '01M292', key: '01M292', value: [Object], doc: [Object] },
			console.log(_.size(docIndex));
			// now we can iterate data sets and iterate 
			_.each(dataSets, function(dataSet){
				console.log('a data set:', _.keys(dataSet)[0]);
				var dataSetKey = _.keys(dataSet)[0];
				_.each(dataSet[dataSetKey], function(singleSchoolDataPoint){
					// console.log('singleSchoolDataPoint:', dataSetKey, singleSchoolDataPoint.dbn, _.keys(singleSchoolDataPoint));
					// if our dbn is in our docIndex it is a school we care about (high school, whatevs);
					if (docIndex[singleSchoolDataPoint.dbn]) {
						docIndex[singleSchoolDataPoint.dbn].doc[dataSetKey] = _.omit(singleSchoolDataPoint, 'dbn'); // do we want to strip dbn PK's yes we do
						console.log('merged:', singleSchoolDataPoint.dbn, dataSetKey, _.size(docIndex[singleSchoolDataPoint.dbn].doc[dataSetKey]));
					}
				});
			});

			// now we are set up to save it back 
			var saveBack = _.pluck(_.values(docIndex), 'doc'); // OMG just the source doc not the whole thing it has our ids and revs
			console.log('saveback school count:', saveBack.length);
			app.schooldb.bulk({docs: saveBack}, function(err, bulkSaved){
				console.log('mergeDataSets saved back:', err, bulkSaved.length);
			});


		});
	}


	function getHSPerformance() {
		// https://data.cityofnewyork.us/resource/xahu-rkwn.json
		var jobs = [];
		_.each(mergeData, function(code, dataset){
			console.log('getting:', dataset, code);
			jobs.push(fetchDataSet.bind(this, code, dataset))
		});
		console.log('async jobs:', jobs);
		async.parallel(jobs, function(err, allData){
			console.log('got additional data:',err, allData.length);

			// now we merge into all our cloudant records OMG
			mergeDataSets(allData);


			// ok ummmm 
		});
		// // UPDATE existing records because we keyed by dbn -- 
		
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
		run: getHSData,  // does the initial fetch + personalty analysis
		runPerformance: getHSPerformance // second step -- fetches additional data and merges into our cloudant docs per school
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