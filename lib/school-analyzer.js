// school-analyzer.js

var req = require('request');
var _ = require('underscore');

var hsDataUrl = "https://data.cityofnewyork.us/resource/n3p6-zve2.json";
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
		run: getHSData
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