// Used for local testing only

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var common = require('./common');
var pdf = require('./tearSheetGenerator');
var secrets = require('./secrets.json');

// Must first create secrets.json from example-secrets.json and edit to contain your AWS credentials
// This updates the AWS config to use your credentials
common.aws.config.update(secrets);

var app = express();

app.use(bodyParser.json());

app.post('/GeneratePDF', function(req, res) {
  console.log('GeneratePDF');
  console.log(req.body);
  var itemUrl = req.body.itemUrl;
  if (!itemUrl) {
    res.statusCode = 400;
    res.send('{"message": "Missing itemUrl in request"}');
  }

  var documentLocation = req.body.itemUrl + "?format=json";
  var awsBucket = 'sunvalleybronze.com-test';
  var tearsheetConfig = {
    documentLocation: documentLocation,
    awsBucket: awsBucket
  };
  pdf(tearsheetConfig, null, function(error, result) {
    if (error) {
      console.log(error);
      res.send(error);
    }
    res.send("https://s3.amazonaws.com/" + awsBucket + "/" + result +  "\n");
  });
});

app.set('port', process.env.PORT || 5001);

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
