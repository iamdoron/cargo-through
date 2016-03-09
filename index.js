"use strict"
const Async = require('async');
const Util = require('util');

module.exports = function cargoThrough(stream, maxPayload, func, callback) {
  let cargo = Async.cargo(func, maxPayload);
  let emittedErrors = [];
  let errors = new Set();
  let streamHasEnded = false;
  stream.on('data', (data) => {
    cargo.push(data, (err) => {
      if (err) {
        errors.add(err);
      }
    });
  }).on('end', () => {
    if (cargo.idle()) {
      end();
    } else {
      cargo.drain = function() {
        cargo.drain = null;
        end();
      }
    }
  }).on('close', end).on('finish', end);

  function end() {
    if (streamHasEnded) {
      return
    }
    streamHasEnded = true;

    if (errors.size > 0) {
      const errorsArr = Array.from(errors);
      const error = new Error(errorsArr.map((err) => err.stack || Util.inspect(err)).join('\n'));
      error.errors = errorsArr
      return callback(error)
    }
    callback()
  }
  stream.on('error', (err) => {
    errors.add(err);
  });
}
