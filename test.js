"use strict"

const Readable = require('stream').Readable;
const cargoThrough = require('./');
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const expect = Code.expect;

lab.experiment('Cargo Through', function () {
  lab.test("should run on all stream inputs with cargo max of 1", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 1, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
      })
    }, (err) => {
      if (err) {
        return done(err);
      }
      expect(actualInputs).to.deep.equal([1,2,3,4,5,6,7,8,9,10]);
      expect(cargos.length).to.equal(10);
      expect(cargos).to.deep.equal([1,2,3,4,5,6,7,8,9,10].map((value) => [value]));
      done();
    });
  });

  lab.test("should run on all stream inputs with cargo max of 3", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
      })
    }, (err) => {
      if (err) {
        return done(err);
      }
      expect(actualInputs).to.deep.equal([1,2,3,4,5,6,7,8,9,10]);
      expect(cargos.length).to.equal(4);
      expect(cargos).to.deep.equal([[1,2,3], [4,5,6], [7,8,9], [10]]);
      done();
    });
  });

  lab.test("should run on an empty stream", function (done) {
    const stream = createStreamWithArrayOfObjects([]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 20, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      doneCargo();
    }, (err) => {
      if (err) {
        return done(err);
      }
      expect(actualInputs).to.deep.equal([]);
      expect(cargos.length).to.equal(0);
      done();
    });
  });

  lab.test("should return error when stream emits error", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
        if (inputs[0] === 1) {
          stream.emit("error", new Error("the error1"))
          stream.emit("error", new Error("the error2"))
        }
      })
    }, (err) => {
      expect(err).to.exist();
      expect(err.message).to.contain("the error1")
      expect(err.message).to.contain("the error2")
      expect(err.message).to.contain("test.js")

      done();
    });
  });

  lab.test("should return error when stream emits error with no stack", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
        if (inputs[0] === 1) {
          const e1 = new Error("the error1");
          const e2 = new Error("the error2");
          delete e1.stack
          delete e2.stack
          e1.customKey = "custom error value"
          stream.emit("error", e1)
          stream.emit("error", e2)
        }
      })
    }, (err) => {
      expect(err).to.exist();
      expect(err.message).to.contain("the error1")
      expect(err.message).to.contain("the error2")
      expect(err.message).to.contain("customKey: 'custom error value'")

      done();
    });
  });
  lab.test("should return error when stream emits error with close event", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10], {dontEnd: true});
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
        if (inputs[0] === 1) {
          stream.emit("error", new Error("the error1"))
          stream.emit("error", new Error("the error2"))
          process.nextTick(() => {
            stream.emit('close');
          })
        }

      })
    }, (err) => {
      expect(err).to.exist();
      expect(err.message).to.contain("the error1")
      expect(err.message).to.contain("the error2")
      expect(err.message).to.contain("test.js")
      done();
    });
  });

  lab.test("should return error when stream emits error with end evend followed by a close event", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo();
        if (inputs[0] === 1) {
          stream.emit("error", new Error("the error1"))
          stream.emit("error", new Error("the error2"))
          process.nextTick(() => {
            stream.emit('close');
          })
        }

      })
    }, (err) => {
      expect(err).to.exist();
      expect(err.message).to.contain("the error1")
      expect(err.message).to.contain("the error2")
      expect(err.message).to.contain("test.js")
      done();
    });
  });
  lab.test("should return errors when there are errors with cargos", function (done) {
    const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
    const actualInputs = [];
    const cargos = [];
    cargoThrough(stream, 3, (inputs, doneCargo) => {
      actualInputs.push.apply(actualInputs, inputs);
      cargos.push(inputs);
      process.nextTick(() => {
        doneCargo(new Error(inputs + ": " + "error."));
      })
    }, (err) => {
      expect(err).to.exist();
      expect(err.errors).to.deep.equal([
         new Error([1,2,3] + ": " + "error."),
         new Error([4,5,6] + ": " + "error."),
         new Error([7,8,9] + ": " + "error."),
         new Error([10] + ": " + "error.")
      ])
      done();
    });
  });
});

function createStreamWithArrayOfObjects(objects, options) {
  options = options || {};
  let closed = false;
  var stream = new Readable({ objectMode: true });

  stream._read = () => {
    if (closed) {
      return
    }
    objects.forEach((obj) => {
      stream.push(obj);
    });
    if (!options.dontEnd) {
      stream.push(null)
    } else {
      closed = true;
    }
  };

  return stream;
}
