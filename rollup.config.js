import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

const {NODE_ENV} = process.env;
const IS_PROD = NODE_ENV === 'production';

console.log('NODE_ENV:', NODE_ENV);

export default {
  input: './src/app.js',

  output: {
    file: `./dist/bundle${IS_PROD ? '.min' : ''}.js`,
    format: 'cjs',
    sourcemap: true,
  },

  plugins: [
    postcss({
      extract: true,
      sourceMap: true,
      minimize: IS_PROD,
    }),

    replace({
      __buildEnv__: NODE_ENV,
      preventAssignment: true,
    }),
    resolve({
      browser: true,
    }),
    commonjs(),

    IS_PROD && babel({
      babelHelpers: 'bundled',
    }),
    IS_PROD && terser(),
  ],
};
