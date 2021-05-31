import test from 'tape';

import {url} from './string';

test('string utils: url`` tagged template', (t) => {
  t.equal(
    url`https://example.org/${'some path'}?param=${'some value'}`,
    'https://example.org/some+path?param=some+value',
    'replaces spaces with "+" characters',
  );

  t.equal(
    url`https://example.org/${'some/other path'}?param=${'some/other value'}`,
    'https://example.org/some%2Fother+path?param=some%2Fother+value',
    'encodes URI components and replaces spaces with "+" characters',
  );

  t.end();
});
