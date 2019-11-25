module.exports = {
  'env': {
    'browser': true,
    'node': true,
    'es6': true,
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  'rules': {
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
  },
};
