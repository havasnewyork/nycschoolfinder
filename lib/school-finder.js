// does the matching against cached school personalities based on a passed student profile.

// DOES A LOT OF WORK

var _ = require('underscore');

var persUtils = require('./personality-util'); // persUtils.flatten()  var traitList = flatten(data.tree),
// persUtils.similarity(one, two);


module.exports = function(app) {
	
	function matcher(studentProfile, done) {
		console.log('list go');
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
		var options = matches; // 
		app.tradeoffAnalytics.dilemmas({columns: columns, subject: "School Comparision", options: options}, function(err, tradeoffData){
			if (err) return done({error: err});

			console.log('ok got a tradeoff setup:', tradeoffData);
		})

		done(null, matches);
	}


	return {
		findSchools: matcher,
		tradeoff: setupTradeoffAnalysis
	}
}