import test from 'tape';

import {clamp} from './number';

test('number utils: clamp', (t) => {
  t.equal(clamp(10, 2, 3), 3);
  t.equal(clamp(10, 20, 30), 20);
  t.equal(clamp(100, 20, 30), 30);

  t.end();
});
