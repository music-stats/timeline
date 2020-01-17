import test from 'tape';

import {url} from './string';

test('string utils: url`` tagged template', (t) => {
  t.equal(
    url`https://example.org/${'some path'}?param=${'some value'}`,
    'https://example.org/some+path?param=some+value',
    'replaces spaces with "+" characters',
  );

  t.end();
});
