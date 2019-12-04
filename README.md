# music-stats timeline

  [![license][license-image]][license-url]
  ![code size][code-size-image]

Visualization of last.fm stats.

## Motivation/goals
Showcasing a ratio between different aspects of how musical taste evolves (or proving that it doesn't).

## Status
*In progress*, *experimental*.

## How does it look like?
<a href="https://user-images.githubusercontent.com/2470363/70138768-42806080-1691-11ea-8a58-194b05ec6e47.png">
  <img width="320" src="https://user-images.githubusercontent.com/2470363/70138768-42806080-1691-11ea-8a58-194b05ec6e47.png" />
</a>

## Design
HTML strings as component templates, canvas as a rendering target, and a static dataset.

## What makes it possible?
### data source
See [scripts supporting the scrobble timeline](https://github.com/music-stats/scripts#scrobble-timeline).

### dev deps
* linter: [`eslint`](https://eslint.org/)
* bundler: [`rollup`](https://github.com/rollup/rollup); [`babel`](https://babeljs.io/) + [`uglify-js`](https://github.com/mishoo/UglifyJS2) for prod builds
* unit tests: TBD

### deps
* templates: [`htm`](https://github.com/developit/htm) + [`vhtml`](https://github.com/developit/vhtml)
* dataviz utils: [`d3-scale`](https://github.com/d3/d3-scale)

## Development setup
```bash
$ npm i                  # install deps
$ npm run lint           # lint scripts and styles
# $ npm test               # run unit tests
$ npm run build:dev      # produce a build artifact for local development
$ npm run build:prod     # produce a minified build artifact for production
$ npm run serve          # run a local dev server (port: 8000)
$ npm run deploy         # deploy to GitHub pages
```

## Further evolvement
See [the list of ideas](/docs/ideas.md).

[license-image]: https://img.shields.io/github/license/music-stats/timeline.svg?style=flat-square
[license-url]: https://github.com/music-stats/timeline/blob/master/LICENSE
[code-size-image]: https://img.shields.io/github/languages/code-size/music-stats/timeline.svg?style=flat-square
