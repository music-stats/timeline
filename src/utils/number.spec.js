import test from 'tape';

import {clamp} from './number';

test('number utils: clamp()', (t) => {
  t.equal(
    clamp(10, 2, 3),
    3,
    'returns max limit if value is greater then max limit',
  );

  t.equal(
    clamp(10, 20, 30),
    20,
    'returns min limit if value is less then min limit',
  );

  t.equal(
    clamp(22, 20, 30),
    22,
    'returns the value itself if it is between min and max limits',
  );

  t.end();
});
