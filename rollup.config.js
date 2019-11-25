import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import {eslint} from 'rollup-plugin-eslint';
import {uglify} from 'rollup-plugin-uglify';

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

    eslint(),
    resolve({
      browser: true,
    }),
    commonjs(),

    IS_PROD && babel(),
    IS_PROD && uglify(),
  ],
};
