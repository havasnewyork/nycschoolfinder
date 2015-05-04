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

				console.log('school personality:', school.doc.dbn, school.doc.watsonPersonality);
				if (!school.doc.watsonPersonality) return;
				var score = persUtils.similarity(studentProfile, school.doc.watsonPersonality);
				var traits = persUtils.flatten(school.doc.watsonPersonality.tree);
				console.log('school traits:', traits);
				console.log('school similarity:', school.doc.dbn, score);
				matches.push({id: school.doc.dbn, score: score, school_name: school.doc.school_name, traits: traits});
			});
			// SORT

			var sorted = _.sortBy(matches, 'score').reverse();
			sorted = sorted.slice(0, 5);

			done(null, sorted);
		});
	}

	return {
		findSchools: matcher
	}
}