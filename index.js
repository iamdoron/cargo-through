"use strict"
const Async = require('async');

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
    streamHasEnded = true;
    if (cargo.idle()) {
      end();
    } else {
      cargo.drain = function() {
        cargo.drain = null;
        end();
      }
    }
  }).on('close', () => {
    if (!streamHasEnded) {
      end();
    }
  });
  function end() {
    if (errors.size > 0) {
      const errorsArr = Array.from(errors);
      const error = new Error(errorsArr.map((err) => err.stack).join('\n'));
      error.errors = errorsArr
      return callback(error)
    }
    callback()
  }
  stream.on('error', (err) => {
    errors.add(err);
  });
}
