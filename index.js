"use strict"
const Async = require('async');

module.exports = function cargoThrough(stream, maxPayload, func, callback) {
  let cargo = Async.cargo(func, maxPayload);
  let emittedError = null;
  let errors = new Set();
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
    function end() {
      if (emittedError) {
        return;
      }
      if (errors.size > 0) {
        const errorsArr = Array.from(errors);
        const error = new Error(errorsArr);
        error.errors = errorsArr
        return callback(error)
      }
      callback()
    }
  });
  stream.on('error', (err) => {
    emittedError = err;
    callback(err);
  });
}
