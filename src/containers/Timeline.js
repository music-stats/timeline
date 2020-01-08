import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as d3Color from 'd3-color';
import html from '../lib/html';

import config from '../config';
import {clamp} from '../utils/number';

import PointCollection from '../stores/PointCollection';
import PointBuffer from '../stores/PointBuffer';
import PointRegistry from '../stores/PointRegistry';
import SummaryRegistry from '../stores/SummaryRegistry';

import Plot from '../components/Plot';
import TimeAxisLabel from '../components/TimeAxisLabel';
import InfoBox from '../components/InfoBox';
import ExternalLinks from '../components/ExternalLinks';
import Legend from '../components/Legend';
import ArtistLabelCollection from '../components/ArtistLabelCollection';

// @todo:
// * for each zoomed range:
//   * update summary numbers/links
//   * add a scale to the time axis (showing months/weeks/days)
// * use "event.deltaX" for horizontal panning, but don't zoom and pan simultaneously
// * support zooming and panning on mobile devices via touch events
// * add unit tests (use "tape")

export default class Timeline {
  constructor(props) {
    const {timeline: {point: {size: scrobbleSize}}} = config;
    const {scrobbleList} = props;

    this.props = props;
    this.children = {};

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.selectedScrobble = null;

    this.scrobbleCollection = new PointCollection(scrobbleList);
    this.scrobbleCollectionZoomed = new PointCollection(scrobbleList);
    this.scrobbleCollectionHighlighted = new PointCollection();
    this.scrobbleBuffer = new PointBuffer(this.scrobbleHalfSize);
    this.scrobbleGenreRegistry = new PointRegistry(({artist: {genre}}) => genre);
    this.scrobbleArtistRegistry = new PointRegistry(({artist: {name}}) => name);
    this.summaryRegistry = new SummaryRegistry(scrobbleList);

    this.scales = {};
    this.genreGroupColorScales = this.getGenreGroupColorScales();

    this.timeRange = [
      this.scrobbleCollection.getFirst().timestamp,
      this.scrobbleCollection.getLast().timestamp,
    ];
    this.timeRangeZoomed = [
      this.scrobbleCollectionZoomed.getFirst().timestamp,
      this.scrobbleCollectionZoomed.getLast().timestamp,
    ];

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handlePlotMouseMove = this.handlePlotMouseMove.bind(this);
    this.handlePlotWheel = this.handlePlotWheel.bind(this);
    this.handleLegendGenreClick = this.handleLegendGenreClick.bind(this);
  }

  resetState() {
    this.scrobbleBuffer.reset();
    this.scrobbleGenreRegistry.reset();
    this.scrobbleArtistRegistry.reset();
    this.scrobbleCollectionHighlighted.reset();
    this.selectedScrobble = null;
  }

  resetUi() {
    const {infoBox, selectedScrobbleTimeLabel, legend, artistLabelCollection} = this.children;

    infoBox.showIntroMessage();
    selectedScrobbleTimeLabel.clear();
    legend.removeGenreHighlight();
    artistLabelCollection.removeAllLabels();
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  initializeChildrenComponents() {
    const {scrobbleList} = this.props;

    this.children.plot = new Plot({
      pointHalfSize: this.scrobbleHalfSize,
      onMouseMove: this.handlePlotMouseMove,
      onWheel: this.handlePlotWheel,
    });

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: this.scrobbleCollection.getFirst().date,
        lastScrobbleDate: this.scrobbleCollection.getLast().date,
      },
      counts: {
        ...this.summaryRegistry.getSummary(),
        scrobbleCount: scrobbleList.length,
        perDayCount: this.getPerDayCount(),
      },
    });

    this.children.externalLinks = new ExternalLinks();

    this.children.firstScrobbleTimeLabel = new TimeAxisLabel({
      id: 'first-scrobble-time-label',
    });
    this.children.lastScrobbleTimeLabel = new TimeAxisLabel({
      id: 'last-scrobble-time-label',
    });
    this.children.selectedScrobbleTimeLabel = new TimeAxisLabel({
      id: 'selected-scrobble-time-label',
      isMostTop: true,
    });

    this.children.legend = new Legend({
      scrobbleList,
      onGenreClick: this.handleLegendGenreClick,
    });

    this.children.artistLabelCollection = new ArtistLabelCollection();
  }

  getPerDayCount() {
    const {scrobbleList} = this.props;
    const firstScrobbleTimestamp = this.scrobbleCollection.getFirst().timestamp;
    const lastScrobbleTimestamp = this.scrobbleCollection.getLast().timestamp;
    const msInDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.ceil((lastScrobbleTimestamp - firstScrobbleTimestamp) / msInDay);
    const perDayCount = Math.round(10 * scrobbleList.length / dayCount) / 10;

    return perDayCount;
  }

  initializeScales() {
    const {
      timeline: {
        plot: {padding: plotPadding},
        point: {size: scrobbleSize, maxMargin: scrobbleMaxMargin},
        timeAxis: {width: timeAxisWidth},
        scales: {albumPlaycount: {range: albumPlaycountScaleRange}},
      },
    } = config;

    const {plot} = this.children;
    const [width, height] = plot.getDimensions();
    const [maxArtistPlaycount, maxAlbumPlaycount] = this.summaryRegistry.getMaxPlaycounts();

    // plot height calculation is ensuring equal vertical gaps between points
    const plotBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const plotMaxHeight = plotBottom - plotPadding;
    let scrobbleMargin = scrobbleMaxMargin;
    let plotHeight = plotMaxHeight;
    while (scrobbleMargin >= 0) {
      const plotHeightNext = (maxArtistPlaycount - 1) * (scrobbleSize + scrobbleMargin);

      if (plotHeightNext > plotMaxHeight) {
        scrobbleMargin -= 1;
      } else {
        plotHeight = plotHeightNext;
        break;
      }
    }
    const plotTop = plotBottom - plotHeight;

    // X axis
    this.scales.timeRangeScale = d3Scale.scaleLinear()
      .domain(this.timeRangeZoomed)
      .rangeRound([plotPadding, width - plotPadding]);

    // Y axis
    this.scales.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    // scrobble point color
    this.scales.albumPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxAlbumPlaycount])
      .range(albumPlaycountScaleRange);
  }

  getGenreGroupColorScales() {
    const {genreGroups} = config;
    const scales = {};
    const maxAlbumPlaycount = this.summaryRegistry.getMaxPlaycounts()[1];

    for (const genreGroup in genreGroups) {
      scales[genreGroup] = d3Scale.scaleSequential()
        .domain([1, maxAlbumPlaycount])
        .range(genreGroups[genreGroup].colorRange);
    }

    return scales;
  }

  getGenreGroupColorByAlbumPlaycount(genreGroup, playcount, toHighlightGenre = false, toHighlightArtist = false) {
    const {timeline: {point: {colorValueFactors}}} = config;
    const genreGroupColorScale = this.genreGroupColorScales[genreGroup];
    const color = d3Color.hsl(
      genreGroupColorScale
        ? genreGroupColorScale(playcount)
        : d3ScaleChromatic.interpolateGreys(this.scales.albumPlaycountScale(playcount)),
    );

    if (toHighlightGenre) {
      color.s *= colorValueFactors.genre.saturation;
      color.l *= colorValueFactors.genre.lightness;
      return color;
    }

    if (toHighlightArtist) {
      color.s *= colorValueFactors.artist.saturation;
      color.l *= colorValueFactors.artist.lightness;
      return color;
    }

    color.s *= colorValueFactors.other.saturation;
    color.l *= colorValueFactors.other.lightness;
    return color;
  }

  highlightGenreScrobbleList(genre, genreGroup, artistNameToSkip = null) {
    const genreScrobbleList = this.scrobbleGenreRegistry.getPointList(genre);

    // there could be no scrobbles for a given genre,
    // since registry is repopulated for when zoomed time range changes
    if (!genreScrobbleList) {
      return;
    }

    const {plot, artistLabelCollection} = this.children;
    const [plotWidth] = plot.getDimensions();
    const artistLastPoints = {};

    genreScrobbleList.forEach(({
      artist: {name: artistName},
      album: {playcount},
      x,
      y,
    }) => {
      if (artistName !== artistNameToSkip) {
        const color = this.getGenreGroupColorByAlbumPlaycount(genreGroup, playcount, true, false);

        this.scrobbleCollectionHighlighted.push({x, y});
        artistLastPoints[artistName] = {x, y, color};
        plot.drawPoint(x, y, color);
      }
    });

    for (const artistName in artistLastPoints) {
      const {x, y, color} = artistLastPoints[artistName];
      artistLabelCollection.renderLabel(x, y, plotWidth, artistName, color, false);
    }
  }

  highlightArtistScrobbleList({index, artist, track}) {
    const {timeline: {point: {selectedColor: selectedTrackColor}}} = config;
    const {plot, selectedScrobbleTimeLabel, artistLabelCollection} = this.children;
    const [plotWidth] = plot.getDimensions();
    const sameTrackPointList = [];
    let lastPoint = null;

    this.scrobbleArtistRegistry.getPointList(artist.name).forEach(({
      index: scrobbleGlobalIndex,
      date,
      album: {playcount},
      track: {name},
      x,
      y,
    }) => {
      const color = this.getGenreGroupColorByAlbumPlaycount(artist.genreGroup, playcount, false, true);

      this.scrobbleCollectionHighlighted.push({x, y});
      lastPoint = {x, y, color};

      // skipping same track scrobbles, those will be rendered after the main loop (to appear on top)
      if (name === track.name) {
        sameTrackPointList.push({x, y});
      } else {
        plot.drawPoint(x, y, color);
      }

      if (scrobbleGlobalIndex === index) {
        selectedScrobbleTimeLabel.renderText(x, plotWidth, date);
      }
    });

    sameTrackPointList.forEach(({x, y}) => plot.drawPoint(x, y, selectedTrackColor));
    artistLabelCollection.renderLabel(lastPoint.x, lastPoint.y, plotWidth, artist.name, lastPoint.color, true);
  }

  removeScrobbleCollectionHighlight() {
    const {plot} = this.children;

    this.scrobbleCollectionHighlighted.getAll().forEach(
      ({x, y}) => plot.drawPoint(x, y, this.scrobbleBuffer.getPoint(x, y).color),
    );
    this.scrobbleCollectionHighlighted.reset();
  }

  selectGenre(genre, genreGroup) {
    const {legend} = this.children;

    // clean old
    this.selectedScrobble = null;
    this.removeScrobbleCollectionHighlight();
    this.resetUi();

    // show new
    this.highlightGenreScrobbleList(genre, genreGroup);
    legend.highlightGenre(genre);
  }

  selectScrobble(scrobble) {
    const {infoBox, legend, artistLabelCollection} = this.children;
    const {artist} = scrobble;

    // clean old
    this.selectedScrobble = scrobble;
    this.removeScrobbleCollectionHighlight();
    infoBox.hideIntroMessage();
    legend.removeGenreHighlight();
    artistLabelCollection.removeAllLabels();

    // show new
    if (artist.genre) {
      this.highlightGenreScrobbleList(artist.genre, artist.genreGroup, artist.name);
      legend.highlightGenre(artist.genre);
    }

    // artist scrobbles are rendered on top of genre scrobbles and artist labels
    this.highlightArtistScrobbleList(scrobble);

    infoBox.renderScrobbleInfo({
      scrobble,
      totals: this.summaryRegistry.getTotals(scrobble),
    });
  }

  selectVerticallyAdjacentScrobble(scrobble, shift) {
    if (scrobble) {
      const adjacentScrobble = this.scrobbleCollectionZoomed.getAdjacent(scrobble, shift);

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  selectHorizontallyAdjacentScrobble(scrobble, shift) {
    if (scrobble) {
      const {artist: {playcount}} = scrobble;
      const adjacentScrobble = this.scrobbleCollectionZoomed.getAdjacent(
        scrobble,
        shift,
        ({artist: {playcount: p}}) => p === playcount,
      );

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  handleWindowResize() {
    // A timeout handle is used for throttling and dealing with mobile device rotation.
    // On some mobile browsers, the "resize" event is triggered before window dimensions are changed.
    clearTimeout(this.windowResizeTimeoutHandle);

    this.windowResizeTimeoutHandle = setTimeout(
      () => {
        this.resetState();
        this.draw();
        this.resetUi();
      },
      100,
    );
  }

  handleDocumentKeydown(event) {
    switch (event.key) {
      case 'Escape': return this.handleEscKeydown();
      case 'ArrowDown': return this.handleArrowDownKeydown();
      case 'ArrowUp': return this.handleArrowUpKeydown();
      case 'ArrowLeft': return this.handleArrowLeftKeydown();
      case 'ArrowRight': return this.handleArrowRightKeydown();
    }
  }

  handleEscKeydown() {
    this.selectedScrobble = null;
    this.removeScrobbleCollectionHighlight();
    this.resetUi();
  }

  handleArrowDownKeydown() {
    this.selectVerticallyAdjacentScrobble(this.selectedScrobble, -1);
  }

  handleArrowUpKeydown() {
    this.selectVerticallyAdjacentScrobble(this.selectedScrobble, 1);
  }

  handleArrowLeftKeydown() {
    this.selectHorizontallyAdjacentScrobble(this.selectedScrobble, -1);
  }

  handleArrowRightKeydown() {
    this.selectHorizontallyAdjacentScrobble(this.selectedScrobble, 1);
  }

  handlePlotMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.scrobbleBuffer.getPoint(x, y);

    if (scrobble) {
      this.selectScrobble(scrobble);
    }
  }

  handlePlotWheel(event) {
    event.preventDefault();

    const {timeline: {zoomDeltaFactor, minTimeRange, plot: {padding: plotPadding}}} = config;
    const {scrobbleList} = this.props;
    const {plot} = this.children;
    const {offsetX, deltaY} = event;

    const [plotWidth] = plot.getDimensions();
    const plotWidthPadded = plotWidth - 2 * plotPadding;

    const timeScale = d3Scale.scaleLinear()
      .domain([0, plotWidthPadded])
      .rangeRound(this.timeRangeZoomed);

    const xTimestamp = timeScale(clamp(offsetX - plotPadding, ...timeScale.domain()));
    const zoomFactor = 1 - deltaY * zoomDeltaFactor;
    const leftTimeRange = (xTimestamp - this.timeRangeZoomed[0]) / zoomFactor;
    const rightTimeRange = (this.timeRangeZoomed[1] - xTimestamp) / zoomFactor;

    if (leftTimeRange + rightTimeRange < minTimeRange) {
      return;
    }

    this.timeRangeZoomed = [
      Math.max(xTimestamp - leftTimeRange, this.timeRange[0]),
      Math.min(xTimestamp + rightTimeRange, this.timeRange[1]),
    ];

    this.scrobbleCollectionZoomed = new PointCollection(scrobbleList.slice(
      this.scrobbleCollection.getPrevious(this.timeRangeZoomed[0]).index,
      this.scrobbleCollection.getNext(this.timeRangeZoomed[1]).index + 1,
    ));

    this.resetState();
    this.draw();
    this.resetUi();
  }

  handleLegendGenreClick(genre, genreGroup) {
    this.selectGenre(genre, genreGroup);
  }

  draw() {
    const {plot, firstScrobbleTimeLabel, lastScrobbleTimeLabel} = this.children;

    // subsequent calls depend on plot dimensions
    plot.scale();
    this.initializeScales();
    plot.drawBackground();

    this.scrobbleCollectionZoomed.getAll().forEach((scrobble) => {
      const {timestamp, artist, album} = scrobble;
      const x = this.scales.timeRangeScale(timestamp);
      const y = this.scales.artistPlaycountScale(artist.playcount);
      const color = this.getGenreGroupColorByAlbumPlaycount(artist.genreGroup, album.playcount);
      const point = {
        ...scrobble,
        x,
        y,
        color,
      };

      plot.drawPoint(x, y, color);
      this.scrobbleBuffer.putPoint(point);
      this.scrobbleGenreRegistry.putPoint(point);
      this.scrobbleArtistRegistry.putPoint(point);
    });

    plot.drawTimeAxis(...this.scales.timeRangeScale.range());

    const [plotWidth] = plot.getDimensions();
    const firstScrobble = this.scrobbleCollectionZoomed.getFirst();
    const lastScrobble = this.scrobbleCollectionZoomed.getLast();
    firstScrobbleTimeLabel.renderText(this.scales.timeRangeScale(firstScrobble.timestamp), plotWidth, firstScrobble.date);
    lastScrobbleTimeLabel.renderText(this.scales.timeRangeScale(lastScrobble.timestamp), plotWidth, lastScrobble.date);
  }

  // things needed for the first render
  beforeRender() {
    this.initializeChildrenComponents();
  }

  // things to initialize after the first render
  afterRender() {
    Object.values(this.children).forEach((child) => {
      if (typeof child.afterRender === 'function') {
        child.afterRender();
      }
    });

    this.subscribe();
  }

  render() {
    return html`
      <main>
        ${Object.values(this.children).map((child) => child.render())}
      </main>
    `;
  }
}
