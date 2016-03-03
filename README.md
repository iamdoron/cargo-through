# cargo-through
A nodejs package that utilizes Async.cargo for object streams. 
```javascript
CargoThrough(stream, maxNumberOfCargoInputs, cargoWorkerFunction, callback);
```
`cargoWorkerFunction` is called sequencialy on each cargo. The cargo consists of all available inputs that were emitted by the stream while working on the previous cargo, capped by maxNumberOfCargoInputs.

# Example

```
$ npm i --save cargo-through
```

```javascript
const CargoThrough = require('cargo-through');
const stream = createStreamWithArrayOfObjects([1,2,3,4,5,6,7,8,9,10]);
const actualInputs = [];
const cargos = [];
CargoThrough(stream, 3, (inputs, doneCargo) => {
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
```
