"use strict"

var pdf = require('./tearSheetGenerator');
process.env.PATH = process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT


/** Operation requested by client -> handler */
const OPERATION_MAP = {
  'pdf': pdf
};

/** Main entry point. */
exports.handler = function (event, context, callback) {
    try {
        pdf(event, context, callback);
    } catch (err) {
        callback(err)
    }
};
