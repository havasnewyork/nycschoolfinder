// does the matching against cached school personalities based on a passed student profile.

// DOES A LOT OF WORK

var _ = require('underscore');

var persUtils = require('./personality-util'); // persUtils.flatten()  var traitList = flatten(data.tree),
// persUtils.similarity(one, two);


module.exports = function(app) {
	
	function matcher(studentProfile, done) {
		console.log('school finder matcher go...');
		app.schooldb.list({include_docs: true}, function(err, schooldocs) {
			if (err) return done({error: err});
			var matches = [];  // hash of schooldocs.dbn to a similarity score
			_.each(schooldocs.rows, function(school) {

				// console.log('school personality:', school.doc.dbn, school.doc.watsonPersonality);
				if (!school.doc.watsonPersonality) return;
				var score = persUtils.similarity(studentProfile, school.doc.watsonPersonality);

				
				var top5 = persUtils.matches(school.doc.watsonPersonality);
				// var traits = persUtils.flatten(school.doc.watsonPersonality.tree);
				// console.log('school traits:', traits);
				// console.log('school similarity:', school.doc.dbn, score);

				// the fields in this object become 
				matches.push({id: school.doc.dbn, score: score, school_name: school.doc.school_name, traits: top5, doc: school.doc});
			});
			// SORT

			var sorted = _.sortBy(matches, 'score').reverse();
			sorted = sorted.slice(0, 5);

			done(null, sorted);
		});
	}


	function setupTradeoffAnalysis(matches, done) {
		// ok matches has the school.doc let us find traditional fields for our setup
		var columns = ["school_sports"]; // 

		// should kinda normalize the options data set so there is just what we are comparing
		var normalizedMatches = [];
		var dataFields = {
			sat: [{"writing_mean": "SAT - Writing Score Average"}, {"mathematics_mean": "SAT - Mathematics Score Average"}, {"critical_reading_mean": "SAT - Critical Reading Score Average"}],
			performance: [{"graduation_rate_historic_avg_similar_schls": "Graduation Rate (%)"}, {"college_career_rate_historic_avg_similar_schls": "College Career Rate (%)"}, {"ontrack_year1_historic_avg_similar_schls" : "On-Track Rate (%)"}],
			safety: [
				{"avgofnocrim_n": "Non-Criminal (avg)"}, 
				{"avgofmajor_n": "Major (avg)"}, 
				{"avgofprop_n": "Property (avg)"}, 
				// {"avgofvio_n": "Violent (avg)"}, 
				// {"avgofoth_n": "Other (avg)"}, 
			]
		}

		// generate our columns
		var columns = [];

		_.each(dataFields, function(field, key1){
			_.each(field, function(sub, i){
				console.log(sub, i);
				// var subField = sub
				console.log(sub, _.keys(sub));
				columns.push({
		            "key": key1 + "." + _.keys(sub)[0],
		            "full_name": _.values(sub)[0],
		            "type": "NUMERIC",
		            "is_objective": true,  // TRUE OR FALSE WHAT IS MEANING HERE -- shows up in the UI and is used in the analysis
		            "goal": key1 === 'safety' ? "MIN": "MAX" // could be MIN for the crime/safety stats
		        })
			})
		});

		// console.log("TRADEOFF COLUMNS:", columns);

		// return;
		// generate our options and our columns
		// .sat.writing_mean .sat.mathematics_mean
		var options = [];
		_.each(matches, function(schoolMatch, i){
			var schoolValues = {};
			// iterate our data fields again
			_.each(dataFields, function(field, key1){
				_.each(field, function(sub, i){
					// console.log(sub, _.keys(sub));
					var key2 =  _.keys(sub)[0];
					// console.log('match 1:', schoolMatch.doc[key1], schoolMatch.id);
					// have to handle gaps in the data - some schools may or may not have full data!
					// IF ANY DATA IS MISSING WE CANNOT ANALYZE GODDAMIT
					if (!schoolMatch.doc[key1]) {
						schoolValues[key1 + '.' + key2] = null;
						console.log('data gap for school:', schoolMatch.id, key1);
						return;
					}
					if (!schoolMatch.doc[key1][key2]) {
						schoolValues[key1 + '.' + key2] = null;
						console.log('data gap for school:', schoolMatch.id, key1, key2);
						return;
					}
					// console.log('match 2:', schoolMatch.doc[key1][key2]);
					var value = parseInt(schoolMatch.doc[key1][key2], 10);
					if (isNaN(value)) value = null;
					schoolValues[key1 + "." + key2] = value; // the actual number goes here
				});
			});
			var schoolId = schoolMatch.id.slice(2); // trim the district
			// console.log('single school set of schoolValues:', schoolValues);
			options.push({
				key: i,
				name: schoolMatch.school_name,
				values: schoolValues,
				description_html: "<p>" + schoolMatch.school_name + "</p><p><a href='http://insideschools.org/search?q=" + schoolId + "' target='_new'>Read more on InsideSchools.org</a></p>" 
			});
		});
// + schoolMatch.id + link to "http://insideschools.org/search?q=" + schoolId
		// console.log("OPTIONS:", options);

		// return;
		// var options = matches; // 
		console.log('step - running tradeoffAnalytics.dilemmas');
		app.tradeoffAnalytics.dilemmas({columns: columns, subject: "School Comparision", options: options}, function(err, tradeoffData){
			if (err) return done({error: err});

			// console.log('ok got a tradeoff setup:', tradeoffData);


			// NOW CACHE INTO CLOUDANT tradeoffdb
			app.tradeoffdb.insert(tradeoffData, function(err, ok){
				console.log('saved a tradeoff run:', err, ok);
				done(null, ok.id); // just send back the id the tradeoff scripts will query the endpoint by itself
			})

			// NOTES HERE -- resolution.solutions is an array of our schools -- status can be "FRONT" or "EXCLUDED" or INCOMPLETE
			// done(null, tradeoffData);
		})
		
	}

	return {
		findSchools: matcher,
		tradeoff: setupTradeoffAnalysis
	}
}

/*

performance:

	"college_career_rate_2012": "40%",
    "college_career_rate_2013": "32%",
    "ontrack_year1_2012": "81%",
    "ontrack_year1_2013": "62%",
    "ontrack_year1_historic_avg_similar_schls": "72%",
    "quality_review_rating": "Proficient",
    "student_satisfaction_historic_avg_similar_schls": "7.3",
    "college_career_rate_historic_avg_similar_schls": "42%",
    "graduation_rate_2013": "58%",
    "quality_review_year": "2012-13",
    "student_satisfaction_2013": "7.1",
    "graduation_rate_2012": "51%",
    "student_satisfaction_2012": "6.3",
    "graduation_rate_historic_avg_similar_schls": "65%"


 "sat": {
    "school_name": "Henry Street School for International Studies ",
    "writing_mean": "385",
    "mathematics_mean": "425",
    "critical_reading_mean": "391",
    "number_of_test_takers": "31"
  },


"safety": {
    "building_name": "220 HENRY STREET CONSOLIDATED LOCATION",
    "location_name": "Henry Street School for International Studies",
    "engroupa": "3C",
    "prop_n": "N/A",
    "geographical_district_code": "1",
    "avgofnocrim_n": "N/A",
    "location_code": "M292",
    "major_n": "N/A",
    "vio_n": "N/A",
    "borough": "MANHATTAN",
    "avgofmajor_n": "N/A",
    "avgofprop_n": "N/A",
    "building_code": "M056",
    "id": "677",
    "register": "448",
    "schools_in_building": "Henry Street School for International Studies | University Neighborhood Middle School | Collaborative Academy of Science, Technology, & La | 220 HENRY STREET CONSOLIDATED LOCATION",
    "nocrim_n": "N/A",
    "avgofvio_n": "N/A",
    "schools": "3",
    "address": "220 HENRY STREET",
    "oth_n": "N/A",
    "rangea": "251-500",
    "avgofoth_n": "N/A"
  },

"progress": {
    "_2010_2011_progress_grade": "C",
    "_2009_10_progress_report_grade": "D",
    "_2010_2011_performance_category_score": "12.8",
    "progress_report_type": "HS",
    "_2010_2011_environment_grade": "D",
    "_2010_2011_performance_grade": "C",
    "school": "Henry Street School for International Studies",
    "principal": "Erin Balet",
    "_2010_2011_environment_category_score": "6.9",
    "_2010_2011_overall_score": "49.8",
    "_2010_2011_progress_category_score": "30.1",
    "peer_index": "1.81",
    "_2010_2011_overall_grade": "C",
    "district": "1",
    "school_level": "High School"
  }


*/