import test from 'tape';

import Collection from './Collection';

test('Collection', (t) => {
  const collection = new Collection([0, 1, 2]);

  t.deepEqual(
    collection.getAll(),
    [0, 1, 2],
    '".getAll()" returns the full list',
  );

  t.equal(
    collection.getFirst(),
    0,
    '".getFirst()" returns the first element',
  );

  t.equal(
    collection.getLast(),
    2,
    '".getLast()" returns the last element',
  );

  collection.push(3, 4, 5);

  t.deepEqual(
    collection.getAll(),
    [0, 1, 2, 3, 4, 5],
    '".push()" pushes elements into the list',
  );

  collection.reset();

  t.deepEqual(
    collection.getAll(),
    [],
    '".reset()" empties the list',
  );

  collection.push(0, 1, 2, 3);

  t.equal(
    collection.findFirst((value) => value > 1),
    2,
    '".findFirst()" finds the first matching element',
  );

  t.equal(
    collection.findFirst((value) => value > 10),
    undefined,
    '".findFirst()" returns "undefined" if no elements match',
  );

  t.equal(
    collection.findLast((value) => value > 1),
    3,
    '".findLast()" finds the last matching element',
  );

  t.equal(
    collection.findLast((value) => value > 10),
    undefined,
    '".findLast()" returns "undefined" if no elements match',
  );

  t.end();
});
