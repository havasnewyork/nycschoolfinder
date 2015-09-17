// school-analyzer.js
'use strict';

var request = require('request');
var _ = require('underscore');
var async = require('async');

// our primary data source
var hsDataUrl = 'https://data.cityofnewyork.us/resource/n3p6-zve2.json';
var cityBaseUrl = 'https://data.cityofnewyork.us/resource/'; // + code + '.json'
var mergeData = {
  performance: 'xahu-rkwn',
  sat: 'zt9s-n5aj',
  safety: 'qybk-bjjc',
  progress: 'upwt-zvh3'
};

var cachedResponse; // json for debugging
module.exports = function(app) {
  function getHSData() {
    console.log('getHSData trying to get data from:', hsDataUrl);
    request({
      url: hsDataUrl,
      json: true
    }, function(error, response, body) {
      if (error) {
        console.log('getHSData error:', error);
        return;
      } else if (response.statusCode !== 200) {
        console.log(response.statusCode);
        console.log('getHSData error getting response for:', hsDataUrl);
        return;
      }
      cachedResponse = body;
      if (app.get('useTestDb')) {
        // limit to 100
        cachedResponse = cachedResponse.slice(0, 99);
        console.log('test - using 100 schools only');
      }
      _.each(cachedResponse, function(aSchool) {
        aSchool._id = aSchool.dbn; // set cloudant doc id as the dbn for simple listing
        console.log('set cloudant id:', aSchool._id);
      });

      app.schooldb.bulk({ docs: cachedResponse }, function(err, done) {
        console.log('schools analyzed');
        if (!err){
          analyzeSchools();
        }
      });
    });
  }

  function fetchDataSet(code, dataset, callback) {
    console.log('fetchDataSet:', code, dataset);
    var dataUrl = cityBaseUrl + code + '.json';
    var ret = {};
    request(dataUrl, function(error, response, body) {
      if (error) {
        console.log('getHSData error:', error);
        callback(error);
        return;
      } else if (response.statusCode !== 200) {
        console.log('fetchDataSet error getting response for:', hsDataUrl);
        callback(error);
        return;
      }
      ret[dataset] = JSON.parse(body); // label our data sets so our async callback knows what is what
      callback(null, ret);
    });
  }


  function mergeDataSets(dataSets) {
    // an array of objects, first key is our key to use for the merge,
    // include all matching by pk of 'dbn' on our
    app.schooldb.list({ include_docs: true }, function(err, schooldocs) {
      if (err) return console.warn('got cloudant error listing schooldb:', err);
      console.log('got school count:', schooldocs.rows.length);
      console.log(schooldocs);
      // this is what we are merging on by the data set key
      var docIndex = _.indexBy(schooldocs.rows, 'id');
      // { id: '01M292', key: '01M292', value: [Object], doc: [Object] },
      console.log(_.size(docIndex));
      // now we can iterate data sets and iterate
      _.each(dataSets, function(dataSet) {
        console.log('a data set:', _.keys(dataSet)[0]);
        var dataSetKey = _.keys(dataSet)[0];
        _.each(dataSet[dataSetKey], function(singleSchoolDataPoint) {
          // if our dbn is in our docIndex it is a school we care about (high school, whatevs);
          if (docIndex[singleSchoolDataPoint.dbn]) {
            // do we want to strip dbn PK's yes we do
            docIndex[singleSchoolDataPoint.dbn].doc[dataSetKey] = _.omit(singleSchoolDataPoint, 'dbn');
            console.log('merged:', singleSchoolDataPoint.dbn, dataSetKey,
              _.size(docIndex[singleSchoolDataPoint.dbn].doc[dataSetKey]));
          }
        });
      });

      // now we are set up to save it back
      var saveBack = _.pluck(_.values(docIndex), 'doc');
      console.log('saveback school count:', saveBack.length);
      app.schooldb.bulk({
        docs: saveBack
      }, function(err, bulkSaved) {
        console.log('mergeDataSets saved back:', err, bulkSaved.length);
      });
    });
  }


  function getHSPerformance() {
    // https://data.cityofnewyork.us/resource/xahu-rkwn.json
    var jobs = [];
    _.each(mergeData, function(code, dataset) {
      console.log('getting:', dataset, code);
      jobs.push(fetchDataSet.bind(this, code, dataset));
    });
    console.log('async jobs:', jobs);
    async.parallel(jobs, function(err, allData) {
      console.log('got additional data:', err, allData.length);
      // now we merge into all our cloudant records OMG
      mergeDataSets(allData);
    });
  }

  function analyzeSchools() {
    console.log('must get school info and cache analysis');
    var fields = [
      'overview_paragraph',
      'extracurricular_activities',
      'advancedplacement_courses',
      'program_highlights'
    ];

    app.schooldb.list({
      include_docs: true
    }, function(err, schooldocs) {
      console.log('got single school data err?:', err);
      console.log(schooldocs.rows.length);
      _.each(schooldocs.rows, function(school) {
        var schooldata = school.doc;
        var sampleText = _.pick(schooldata, fields);
        sampleText = _.values(sampleText).join(' ');
        var wc = sampleText.split(' ').length;

        if (wc < 100) {
          console.warn(schooldata.dbn, ' - sampleText less than 100, not analyzing', wc);
          return;
        } else {
          console.log(schooldata.dbn, ' - sample text word count:', wc);
        }

        app.persInsights.profile({
          text: sampleText
        }, function(err, profile) {
          if (err)
            return console.warn(school,' PI:', schooldata.dbn, err);
          schooldata.watsonPersonality = profile;
          app.schooldb.bulk({
              docs: [schooldata]
            }, function(err, updated) {
              console.log(schooldata.dbn, ' - updated schooldata with watsonPersonality:', updated);
            });
        });
      });
    });
  }
  return {
    run: getHSData,
    runPerformance: getHSPerformance
  };
};