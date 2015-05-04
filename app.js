/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'),
  app = express(),
  watson = require('watson-developer-cloud'),
  bluemix = require('./config/bluemix'),
  extend = require('util')._extend;

// Bootstrap application settings
require('./config/express')(app);
var services = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : require('./VCAP_SERVICES');

// // if bluemix credentials exists, then override local
// var credentials = extend({
//   version: 'v1', // API version
//   url: '<url>',
//   username: '<username>',
//   password: '<password>'
// }, bluemix.getServiceCreds('concept_expansion')); // VCAP_SERVICES

// Create the service wrapper
// console.log('services:', services);
// var ce_creds = bluemix.getServiceCreds('concept_expansion', services);
// console.log(ce_creds);
// ce_creds.version = 'v1';
// var concept_expansion = watson.concept_expansion(ce_creds);

var re_creds = bluemix.getServiceCreds('relationship_extraction', services);
// console.log(re_creds);
re_creds.version = 'v1';


var qa_creds = bluemix.getServiceCreds('question_and_answer', services);
// console.log(qa_creds);
qa_creds.version = 'v1';



var pers_creds = bluemix.getServiceCreds('personality_insights', services);
// console.log(qa_creds);
pers_creds.version = 'v2';

app.set('useTestDb', true);



var relationship_extraction = watson.relationship_extraction(re_creds);
var question_answer = watson.question_and_answer(qa_creds);
app.persInsights = watson.personality_insights(pers_creds);

var analyzer = require('./lib/school-analyzer')(app);
var finder = require('./lib/school-finder')(app);

var persUtils = require('./lib/personality-util'); // persUtils.flatten()  var traitList = flatten(data.tree),
// persUtils.similarity(one, two);


var Cloudant = require('cloudant')
 
var cloudant_creds = bluemix.getServiceCreds('cloudantNoSQLDB', services);
 
Cloudant({account:cloudant_creds.username, password:cloudant_creds.password}, function(er, cloudant) {
  if (er)
    return console.log('Error connecting to Cloudant account %s: %s', me, er.message)
 
  console.log('Connected to cloudant', app.get('useTestDb'));
  var dbname = 'schools';
  if (app.get('useTestDb')) dbname += "_test";
  console.log('using db:', dbname);
  app.schooldb = cloudant.use(dbname);

  // should put a check to see last date of analysis - no for hthon
  // console.log('starting school-analyzer:');
  // analyzer.run(); // DO NOT RUN ALL THE TIME

  // TODO check the database to see if an initial analyzer run needs to be performed

})



// var qa_datasets;

// question_answer.datasets({}, function(err, data){
//   console.log('our qa datasets:', data);
// })


app.get('/', function(req, res) {

  // get a count of our db records

  app.schooldb.list(function(err, docs){
    console.log('index school list:', docs.rows.length);

    res.render('index', {
      schoolCount: docs.rows.length
    });
  });

  
});



app.post('/student/submit', function(req, res){
  console.log('post form:', req.body.studentSample.length);
  // if (req.body.studentSample;)
  app.persInsights.profile({text: req.body.studentSample}, function(err, studentPersonality){
    console.log('got a student profile:', err, studentPersonality);
    if (err) {
      res.render('error', {
        error: 'got an error, try a longer input'
      });
      return;
    }
    console.log('finding matches...');
    // TODO matching algorithm here against all schools
    finder.findSchools(studentPersonality, function(err, matches){
      // console.log('potential school matches:', matches);
      if (err) {
        res.render('error', {
          error: err.error
        });
        return;
      }

      // do some munging on the student top5 compared to schools
      // var matchedTraits = persUtils.matches(studentProfile, school.doc.watsonPersonality);

      res.render('response-choice', {
        matches: matches,
        studentPersonality: JSON.stringify(persUtils.matches(studentPersonality), null, 4) //JSON.stringify(persUtils.flatten(studentPersonality.tree), null, 4)
      });

    })

    


  })


});




var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);