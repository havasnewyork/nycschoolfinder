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

var relationship_extraction = watson.relationship_extraction(re_creds);
var question_answer = watson.question_and_answer(qa_creds);

var qa_datasets;

question_answer.datasets({}, function(err, data){
  console.log('our qa datasets:', data);
})


app.get('/', function(req, res) {
  res.render('adventure', req.query);
});


// app.post('/health', function(req, res){

// });

app.post('/step', function(req, res){
  console.log('post form:', req.body);
  

  question_answer.ask({
    text: "What is an adventure we can have in " + req.body.city,
    dataset: 'travel'}, function(err, answers){
      console.log(err, answers);
      if (!err) {
        console.log(answers[0].question.answers); // array of objects pipeline == 'Descriptive' are actual sentences

        // each answer text could go into 
        relationship_extraction.extract({dataset: 'ie-en-news', text: answers[0].question.answers[0].text}, function(err, data){
          console.log('answer relationships:', data);
        });


        // <entity eid="-E6" type="GPE"

        // starts you out somewhere and you have to figure out how to go somewhere else? or you have to figure out where it is?

        // actions in a city -- "how can I " + action + " in " + city -- 

        // you are in city,  you know these things (q&a results) what do you want to do?

        // get some money

        // you come to an ATM machine

        // find the airport



        res.render('adventure-choice', {
          answers: answers[0].question.answers,
          currentCity: req.body.city
        });
      }
    });

  // res.render('adventure', req.body);
});


// app.post('/concept/create', function(req, res) {
//   var payload = {
//     'seeds': req.body.seeds.trim().split('\r\n'),
//     'dataset': req.body.dataset,
//     'label': req.body.label,
//   };

//   concept_expansion.createJob(payload, function(err, result) {
//     if (err)
//       return res.json({ error: 'Error creating the job'});
//     else
//       return res.json(result);
//   });
// });

// app.get('/concept/status', function(req, res) {
//   concept_expansion.getStatus({ jobid: req.query.jobid }, function(err, result) {
//     if (err)
//       return res.json({ error: 'Error getting the job status' });
//     else
//       return res.json({ status: result.state || 'F' });
//   });
// });

// app.post('/concept/result', function(req, res) {
//   concept_expansion.getResult({ jobid: req.body.jobid }, function(err, result) {
//     if (err)
//       return res.json({ error: 'Error getting the job result' });
//     else
//       return res.json(result);
//   });
// });





var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);