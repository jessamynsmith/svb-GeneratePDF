"use strict";

var aws = require('aws-sdk')
aws.config.region = 'us-east-1';


function toS3Path(path) {
  return (path && path[0] === '/') ? path.slice(1) : path
}


function toDropboxPath(path) {
  return (path && path[0] !== '/') ? '/' + path : path
}


module.exports = {
  aws: aws,
  toS3Path: toS3Path,
  toDropboxPath: toDropboxPath
};

