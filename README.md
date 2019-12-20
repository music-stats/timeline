# music-stats timeline

  [![license][license-image]][license-url]
  ![code size][code-size-image]

Visualization of last.fm stats.

## Motivation/goals
Showcasing a ratio between different aspects of how musical taste evolves (or proving that it doesn't).

## Status
*In progress*, *experimental*.

## How does it look like?
<p align="center">
  <a href="https://user-images.githubusercontent.com/2470363/70378960-5e9d2f80-1927-11ea-8367-de163c2d7862.png">
    <img width="720" alt="screenshot" src="https://user-images.githubusercontent.com/2470363/70378960-5e9d2f80-1927-11ea-8367-de163c2d7862.png" />
  </a>
</p>

## Design
This is a dataviz app that runs a couple of steps:
1. Fetches a static dataset and prepares data for rendering (initializes scales and helpers).
1. Plots data on canvas and shows stats as DOM elements using HTML strings as component templates.
1. Listens for user interactions (mouse and keyboard events) and highlights points on the plot.

Codebase is organized according to simple rules:
```
src/
├── components  # "dumb" components - layout and styling
├── containers  # "smart" components - data processing, interaction and mediation logic
├── lib         # configured dependencies
├── stores      # stateful classes acting as data accessors
├── utils       # stateless helpers, no app logic
├── app.js      # app entry point
└── config.js   # hardcoded values go there (including plot-specific styling)
```

## What makes it possible?
### data source
See [scripts supporting the scrobble timeline](https://github.com/music-stats/scripts#scrobble-timeline).

### dev deps
* linter: [`eslint`](https://eslint.org/)
* bundler: [`rollup`](https://github.com/rollup/rollup); [`babel`](https://babeljs.io/) + [`uglify-js`](https://github.com/mishoo/UglifyJS2) for prod builds
* unit tests: TBD

### deps
* templates: [`htm`](https://github.com/developit/htm) + [`vhtml`](https://github.com/developit/vhtml)
* dataviz utils: [`d3-scale`](https://github.com/d3/d3-scale), [`d3-scale-chromatic`](https://github.com/d3/d3-scale-chromatic)

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
