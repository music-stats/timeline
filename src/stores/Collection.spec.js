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

  collection.setVisibleIndexRange(1, 2);

  t.equal(
    collection.getFirstVisible(),
    1,
    '".getFirstVisible()" return the first element from the visible range',
  );

  t.equal(
    collection.getLastVisible(),
    2,
    '".getLastVisible()" return the last element from the visible range',
  );

  t.equal(
    collection.getAdjacentVisible(1, +1, (value) => value % 2 === 0),
    2,
    '".getAdjacentVisible()" finds the nearest visible matching element (searching to the right)',
  );

  t.equal(
    collection.getAdjacentVisible(3, -1, (value) => value % 2 === 1),
    1,
    '".getAdjacentVisible()" finds the nearest visible matching element (searching to the left)',
  );

  t.end();
});
