'use strict';

(function() {

// JQuery variables
var $loading = $('.loading'),
  $jobStatus = $('.jobStatus'),
  $error = $('.error'),
  $concepts = $('.concepts'),
  $jobId = $('.jobId');

var statusMap = {
  'D' : 'Done',
  'R': 'Retrieved',
  'F': 'Failed',
  'A': 'Awaiting Work',
  'G': 'In Flight'
};

var updateStatus = function (status){
  status = status || 'A';
  $jobStatus.text(statusMap[status]);
  $jobStatus.removeClass().addClass('state_'+status);

  if (status === 'A' || status === 'G')
    $loading.show();
  else
    $loading.hide();

};
var updateJobId = function (job){
  $jobId.text(job.jobid || '');
};

var showError = function(error){
      $error.text(error);
      updateStatus('F');

      $error.hide();
      $error.show();
};
var showResults = function(concepts) {
    var $table = $('<table class="resultTable" width="100%">' +
      '<tr><th>Prevalence</th><th>Result</th></tr>' +
      '</table>');
    var rows = '';
    concepts.slice(0, 10).forEach(function(cp) {
      rows += '<tr class="concept"><td>' + cp.prevalence + '</td><td>' + cp.result + '</td></tr>';
    });
    $table.append(rows);

    $concepts.html($table);
    $concepts.show();
    $error.hide();
};

var createJob = function(job, callback) {
  $concepts.hide();
  $error.hide();

  $.post('/concept/create', job, callback);
};

var getStatus = function(job, callback) {
  $.get('/concept/status', job, callback);
};

var getResult = function(job, callback) {
  $.post('/concept/result', job, callback);
};

var expandConcept = function(params, callback) {
  createJob(params, function( job ) {
      if (!job || job.error)
        return callback(job);

    updateJobId(job);
    updateStatus('A');
    var processStatus = function(res) {
      if (res.error || !res.status)
        return callback(res);

      var status = res.status;

      updateStatus(status);

      //if Awaiting Work or In Flight
      if (status === 'A' || status === 'G') {
        setTimeout(function() {
          getStatus(job, processStatus);
        }, 4000);

      } else if (status === 'R' ) { // If retrieved
        callback({error: 'Retrieved'});
      } else if (status === 'F' ) { // If fail
        callback({error: 'Fail'});
      } else if (status === 'D') { // if done
        getResult(job, callback);
      } else {
        callback({ error:'Unrecognized status: '+status});
      }
    };

    getStatus(job,processStatus);
  });
};

$('.jobForm').submit(function(e) {
  // Prevent form submition
  e.preventDefault();
  // POST /concept/create with the form data
  var jobData = $('.jobForm').serialize();
  console.log(jobData);
  expandConcept(jobData, function (result) {
    if (!result || result.error) {
      showError(result.error);
      return;
    }
    showResults(result.return_seeds);
  });

  // Focus the seeds list
  $('.seeds').focus();
  return false;
});


})();