// NYC School Finder - IBM Watson Hackathon Entry - 2015

'use strict';

var express = require('express'),
  app = express(),
  watson = require('watson-developer-cloud'),
  bluemix = require('./config/bluemix'),
  cors = require('cors'),
  extend = require('util')._extend;



// Bootstrap application settings

// FOR LOCAL DEVELOPMENT PUT A COPY OF THE VCAP_SERVICES BLUEMIX ENVIRONMENT INTO VCAP_SERVICES.json
require('./config/express')(app);
var services = process.env.VCAP_SERVICES ? JSON.parse(process.env.VCAP_SERVICES) : require('./VCAP_SERVICES-local');


// hash comparison for DEMO SPEED

var hash = require('string-hash');


// set config flags for db usage
app.set('useTestDb', false); // the test db only has 99 records for development speed....
app.use(cors());

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

// var re_creds = bluemix.getServiceCreds('relationship_extraction', services);
// // console.log(re_creds);
// re_creds.version = 'v1';


// var qa_creds = bluemix.getServiceCreds('question_and_answer', services);
// // console.log(qa_creds);
// qa_creds.version = 'v1';



var pers_creds = bluemix.getServiceCreds('personality_insights', services);
// console.log(qa_creds);
pers_creds.version = 'v2';
// specific credentials required for demo - didn't work
// pers_creds.use_vcap_services = false;
// pers_creds.username = "275e5835-1cf1-4e6e-b443-88d82ee1dcd4";
// pers_creds.password = "XZ84g7B7GEpM";



var tradeoff_creds = bluemix.getServiceCreds('tradeoff_analytics', services);
// console.log(qa_creds);
tradeoff_creds.version = 'v1';



app.persInsights = watson.personality_insights(pers_creds);
app.tradeoffAnalytics = watson.tradeoff_analytics(tradeoff_creds);  // .dilemmas({columns, subject, options})

var analyzer = require('./lib/school-analyzer')(app);
var finder = require('./lib/school-finder')(app);

var persUtils = require('./lib/personality-util'); // persUtils.flatten()  var traitList = flatten(data.tree),
// persUtils.similarity(one, two);


var Cloudant = require('cloudant')
 
var cloudant_creds = bluemix.getServiceCreds('cloudantNoSQLDB', services);
 
Cloudant({account:cloudant_creds.username, password:cloudant_creds.password}, function(er, cloudant) {
  if (er)
    return console.log('Error connecting to Cloudant account %s: %s', er.message)
 
  console.log('Connected to cloudant', app.get('useTestDb'));
  var dbname = 'schools';
  if (app.get('useTestDb')) dbname += "_test";
  console.log('using db:', dbname);
  app.schooldb = cloudant.use(dbname);
  app.tradeoffdb = cloudant.use('tradeoffs');

  // should put a check to see last date of analysis - no for hthon
  // console.log('starting school-analyzer:');
  // analyzer.run(); // DO NOT RUN ALL THE TIME - set a command-line flag
  console.log("analyze?", process.argv);
  if (process.argv.length > 2) {
    console.log('checking command line flag to run analyzer:', process.argv);
    if (process.argv[2] === 'analyze') {
      analyzer.run();
    }
    if (process.argv[2] === 'mergePerformance') {
      analyzer.runPerformance();
    }
  }

  // TODO check the database to see if an initial analyzer run needs to be performed

})



// var qa_datasets;

// question_answer.datasets({}, function(err, data){
//   console.log('our qa datasets:', data);
// })


app.get('/', function(req, res) {

  // get a count of our db records
  if (!app.schooldb) {
    res.render('index', {schoolCount: 435});
    return;
  }

  app.schooldb.list(function(err, docs){
    console.log('index school list:', docs.rows.length);

    res.render('index', {
      schoolCount: docs.rows.length
    });
  });

  
});



app.post('/student/submit', function(req, res){
  console.log('post form:', req.body.studentSample.length);

  // if (req.body.studentSample.length < 100)

  // FIRST CHECK OUR HASH if we pre-ran this sample
  var studentSample = req.body.studentSample;
  var sampleHash = hash(studentSample);
  console.log('input sample hash:', sampleHash);
  app.tradeoffdb.get(sampleHash, function(err, data){
    console.log('checked for previous run:', typeof err);
    // err will be 404 for no previous run
    if (err && err.status_code === 404) {
    // if (true) { // temp avoid cache
      console.log('no previous run found, running analysis...', studentSample.length);
      // if (req.body.studentSample;)
      app.persInsights.profile({text: studentSample}, function(err, studentPersonality){
        console.log('got a student profile:', err, studentPersonality);
        if (err) {
          res.status(500);
          res.render('error', {
            error: 'Your input was too short. Please try more than 100 words.'
          });
          return;
        }
        console.log('finding matches...');
        // TODO matching algorithm here against all schools
        finder.findSchools(studentPersonality, function(err, matches){
          // console.log('potential school matches:', matches);
          if (err) {
            res.status(500);
            console.log('finder.findSchools err:', err);
            res.render('error', { error: JSON.stringify(err.error) });
            return;
          }

          // do some munging on the student top5 compared to schools 

          // prepare the tradeoff setup
          finder.tradeoff(matches, function(err, finalMatchData){ // now returns an object with matches that had enough data to tradeoff analyze...
            // changed to return a cache to the tradeoff result run a separate cloudant db
            if (err) {
              res.status(500);
              console.log('finder.tradeoff err:', err);
              res.render('error', { error: JSON.stringify(err.error) });
              return;
            }
            var tradeoffId = finalMatchData.tradeoffId;

            var results = {
              sampleId: sampleHash, // our future DB id
              isCached: false, // this will get saved - just override when reading
              matches: finalMatchData.matches, // JUST WHAT IS USED IN TRADEOFF PLZ
              tradeoff: '/tradeoff/' + tradeoffId,
              studentPersonality: persUtils.matches(studentPersonality) //JSON.stringify(persUtils.flatten(studentPersonality.tree), null, 4)
            };

            // let's cache? what should we cache really just what we are sending? need fast for demos
            // just save and forget
            app.tradeoffdb.insert(results, sampleHash + "", function(err, ok){  // FORCE STRING FOR CLOUDANT ID
              console.log('cached an analysis run:', err, ok);
            });
            // res.render('response-choice', {
            res.json(results); // done sending JSON back
          }); // end tradeoff run
        }); // end school matcher
      }); // end personality profile run

    } else if (data) {
      // we got a cached run!
      console.log('found a cached run:', data);
      data.isCached = true;
      res.json(data);
    } else {
      console.log('no cached run and no data, fubar');

      if (err) {
        res.status(500);
        res.render('error', {
          error: 'Your input was too short. Please try more than 100 words.'
        });
        return;
      }

      res.status(500);
      res.render('error', { error: "no cached analysis found, no data sent, no error, cant analyze anything" });
    }

  });

  


});

function getTradeoff(req, res){
  // CORS PLZ this is called from the iframe
  console.log("TRADEOFF REQUEST:", req.params.id);
  app.tradeoffdb.get(req.params.id, function(err, tradeoffData){
    console.log('got a tradeoff:', err, tradeoffData);
    res.json(tradeoffData);
  });
}

app.get('/tradeoff/:id', getTradeoff);
app.post('/tradeoff/:id', getTradeoff);

app.post('/schools/compare', function(req, res) {
  // set up a tradeoff analytics from a set of schools
  // ??? do this in the first response all at once???
})




var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);