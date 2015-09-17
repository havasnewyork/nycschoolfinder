'use strict';

// does the matching against cached school personalities based on a passed student profile.

var _ = require('underscore'),
  persUtils = require('./personality-util');

module.exports = function(app) {

  function matcher(studentProfile, done) {
    console.log('school finder matcher go...');
    app.schooldb.list({
      include_docs: true
    }, function(err, schooldocs) {
      if (err) return done({
        error: err
      });
      var matches = []; // hash of schooldocs.dbn to a similarity score
      _.each(schooldocs.rows, function(school) {
        if (excludeIncompleteSchool(school.doc)) return;

        var score = persUtils.similarity(studentProfile, school.doc.watsonPersonality);
        var top5 = persUtils.matches(school.doc.watsonPersonality);
        console.log('checking school:',score,top5);

        // the fields in this object become
        matches.push({
          id: school.doc.dbn,
          score: score,
          school_name: school.doc.school_name,
          traits: top5,
          doc: school.doc
        });
      });

      var sorted = _.sortBy(matches, 'score').reverse();
      sorted = sorted.slice(0, 20); // more for the tradeoff due to low data matches

      done(null, sorted);
    });
  }

  // validate that school record has complete data set required for personality + tradeoffs
  function excludeIncompleteSchool(schoolDoc) {
    if (!schoolDoc.watsonPersonality) return true;
    // sat fields
    if (!schoolDoc.sat) return true;
    if (!schoolDoc.sat.writing_mean) return true;
    if (!schoolDoc.sat.mathematics_mean) return true;
    if (!schoolDoc.sat.critical_reading_mean) return true;
    // performance fields
    if (!schoolDoc.performance) return true;
    if (!schoolDoc.performance.graduation_rate_historic_avg_similar_schls) return true;
    if (!schoolDoc.performance.college_career_rate_historic_avg_similar_schls) return true;
    if (!schoolDoc.performance.ontrack_year1_historic_avg_similar_schls) return true;
    return false;
  }

  function setupTradeoffAnalysis(matches, done) {
    console.log('setupTradeoffAnalysis matches:',matches);
    var finalMatches = []; // push only matches that have enough data to tradeoff!
    // should kinda normalize the options data set so there is just what we are comparing
    var dataFields = {
      sat: [
        { 'writing_mean': 'SAT - Writing Score Average'},
        { 'mathematics_mean': 'SAT - Mathematics Score Average'},
        { 'critical_reading_mean': 'SAT - Critical Reading Score Average' }],
      performance: [
        { 'graduation_rate_historic_avg_similar_schls': 'Graduation Rate (%)' },
        { 'college_career_rate_historic_avg_similar_schls': 'College Career Rate (%)' },
        { 'ontrack_year1_historic_avg_similar_schls': 'On-Track Rate (%)'}
      ]
    };

    // TODO add our scores
    var columns = [{
      key: 'personality.score',
      full_name: 'Personality Match Score',
      type: 'NUMERIC',
      is_objective: true,
      goal: 'MAX'
    }];

    _.each(dataFields, function(field, key1) {
      _.each(field, function(sub) {
        columns.push({
          key: key1 + '.' + _.keys(sub)[0],
          full_name: _.values(sub)[0],
          type: 'NUMERIC',
          is_objective: true,
          goal: key1 === 'safety' ? 'MIN' : 'MAX'
        });
      });
    });

    // return;
    // generate our options and our columns
    var options = [];
    _.each(matches, function(schoolMatch) {
      var schoolValues = {
        'personality.score': schoolMatch.score // hard code our personality match score
      };
      var hadDataGap = false;
      // iterate our data fields again
      _.each(dataFields, function(field, key1) {
        _.each(field, function(sub) {
          var key2 = _.keys(sub)[0];
          var value; // may not be defined
          if (!schoolMatch.doc[key1]) {
            value = null;
            console.log('data gap for school:', schoolMatch.id, key1);
            return;
          }
          if (!schoolMatch.doc[key1][key2]) {
            value = null;
            console.log('data gap for school:', schoolMatch.id, key1, key2);
            return;
          }
          // console.log('match 2:', schoolMatch.doc[key1][key2]);
          value = parseInt(schoolMatch.doc[key1][key2], 10);
          if (isNaN(value)) value = null;

          if (value)
            schoolValues[key1 + '.' + key2] = value;
          else
            hadDataGap = true;
        });
      });

      var schoolId = schoolMatch.id.slice(2); // trim the district
      if (!hadDataGap) {
        finalMatches.push(schoolMatch);
        options.push({
          key: options.length + 1,
          name: schoolMatch.school_name,
          values: schoolValues,
          description_html: '<p>' + schoolMatch.doc.overview_paragraph +
            '</p><p><a href="http://insideschools.org/search?q=' + schoolId + '"'+
            ' target="_new">Read more on InsideSchools.org</a></p>'
        });
      }
    });
    var tradeoffData = {
      columns: columns,
      subject: 'School Comparision',
      options: options
    };

    app.tradeoffAnalytics.dilemmas(tradeoffData, function(err, tradeoffData) {
      if (err) return done({
        error: err
      });

      // NOW CACHE INTO CLOUDANT tradeoffdb
      app.tradeoffdb.insert(tradeoffData, function(err, ok) {
        console.log('saved a tradeoff run:', err, ok);
        done(null, { tradeoffId: ok.id, matches: finalMatches });
      });
    });
  }

  return {
    findSchools: matcher,
    tradeoff: setupTradeoffAnalysis
  };
};