# music-stats timeline

  [![license][license-image]][license-url]
  ![code size][code-size-image]

Visualization of last.fm stats.
Showcasing a ratio between different aspects of how musical taste evolves (or proving that it doesn't).

## Status
*Ready*, but there's a short [todo list](/docs/todo.md) to finish.

## How does it look like?
<p align="center">
  <a href="https://user-images.githubusercontent.com/2470363/77892505-62a8e080-727b-11ea-8a2b-39e2838e70e0.png">
    <img width="720" alt="screenshot" src="https://user-images.githubusercontent.com/2470363/77892505-62a8e080-727b-11ea-8a2b-39e2838e70e0.png" />
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
├── components/  # "dumb" components - layout and styling
├── containers/  # "smart" components - plot rendering and user interaction handlers
├── dataset/     # initial data transformation steps
├── lib/         # configured dependencies
├── stores/      # stateful classes acting as data accessors
├── utils/       # stateless general purpose utils, no app logic
├── app.js       # app entry point
└── config.js    # hardcoded values, including plot-specific styling
```

Among containers and components there are `<...Interactive />` classes that act as decorators.
Such classes add various handlers that define behavior for classes they decorate (e.g. highlighting on mouse move).

## What makes it possible?
### data source
Datasets are supplied by [scripts](https://github.com/music-stats/scripts#scrobble-timeline) and served from the following URL structure (see `src/config.js`):
```
data/
├── years.json              # a list of periods available, e.g. ["2012", "2013", ..., "2022", "all"]
├── years/                  # scrobble lists for each period
│   ├── ...
│   ├── 2022.json
│   └── all.json
└── artists-by-genres.json  # enables the legend and colorcoding
```

### dev deps
* linter: [`eslint`](https://eslint.org/)
* bundler: [`rollup`](https://github.com/rollup/rollup); [`babel`](https://babeljs.io/) + [`terser`](https://github.com/terser/terser) for prod builds
* unit tests: [`tape`](https://github.com/substack/tape) + [`tap-spec`](https://github.com/scottcorgan/tap-spec) + [`@babel/register`](https://babeljs.io/docs/en/babel-register) + [`ignore-styles`](https://github.com/bkonkle/ignore-styles)

### deps
* templates: [`htm`](https://github.com/developit/htm) + [`vhtml`](https://github.com/developit/vhtml) + [`classnames`](https://github.com/JedWatson/classnames)
* dataviz utils: [`d3-scale`](https://github.com/d3/d3-scale), [`d3-color`](https://github.com/d3/d3-color)
* router: [`micro-conductor`](https://github.com/oleksmarkh/micro-conductor)

### colors
Color ranges for genres are picked from Cynthia A. Brewer’s [ColorBrewer](http://colorbrewer2.org/).

## Development setup
```bash
$ npm ci              # install deps
$ npm run lint        # lint scripts
$ npm test            # run unit tests
$ npm run build:dev   # produce a build artifact for local development
$ npm run build:prod  # produce a minified build artifact for production
$ npm run serve       # run a local dev server (port: 8000)
$ npm run deploy      # deploy to GitHub pages
```

[license-image]: https://img.shields.io/github/license/music-stats/timeline.svg?style=flat-square
[license-url]: https://github.com/music-stats/timeline/blob/master/LICENSE
[code-size-image]: https://img.shields.io/github/languages/code-size/music-stats/timeline.svg?style=flat-square
