import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import * as d3Color from 'd3-color';
import html from '../lib/html';

import config from '../config';
import {dateTimeStringToDateString} from '../utils/date';
import {clamp} from '../utils/number';

import PointCollection from '../stores/PointCollection';
import PointBuffer from '../stores/PointBuffer';
import PointRegistry from '../stores/PointRegistry';
import SummaryRegistry from '../stores/SummaryRegistry';

import Plot from '../components/Plot';
import TimeAxisLabel from '../components/TimeAxisLabel';
import InfoBox from '../components/InfoBox';

// @todo:
// * support zooming on mobile devices via touch events
// * add unit tests (use "tape")

export default class Timeline {
  constructor(props) {
    const {timeline: {point: {size: scrobbleSize}}} = config;
    const {scrobbleList} = props;

    this.props = props;
    this.children = {};

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.selectedScrobble = null;
    this.toShowIntroMessage = true;

    this.scrobbleCollection = new PointCollection(scrobbleList);
    this.scrobbleCollectionZoomed = new PointCollection(scrobbleList);
    this.scrobbleCollectionHighlighted = new PointCollection();
    this.scrobbleBuffer = new PointBuffer(this.scrobbleHalfSize);
    this.scrobbleRegistry = new PointRegistry(({artist: {name}}) => name);
    this.summaryRegistry = new SummaryRegistry(scrobbleList);

    this.scales = {};
    this.genreColorScales = this.getGenreColorScales();

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handlePlotMouseMove = this.handlePlotMouseMove.bind(this);
    this.handlePlotWheel = this.handlePlotWheel.bind(this);
  }

  reset() {
    this.scrobbleBuffer.reset();
    this.scrobbleRegistry.reset();
    this.scrobbleCollectionHighlighted.reset();
    this.selectedScrobble = null;
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  initializeChildrenComponents() {
    const {scrobbleList} = this.props;
    const [dayCount, perDayCount] = this.getPeriodCounts();

    this.children.plot = new Plot({
      pointHalfSize: this.scrobbleHalfSize,
      onMouseMove: this.handlePlotMouseMove,
      onWheel: this.handlePlotWheel,
    });

    this.children.timeAxisLabel = new TimeAxisLabel();

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: dateTimeStringToDateString(this.scrobbleCollection.getFirst().date),
        lastScrobbleDate: dateTimeStringToDateString(this.scrobbleCollection.getLast().date),
      },
      counts: {
        ...this.summaryRegistry.getSummary(),
        scrobbleCount: scrobbleList.length,
        dayCount,
        perDayCount,
      },
    });
  }

  getPeriodCounts() {
    const {scrobbleList} = this.props;
    const firstScrobbleTimestamp = this.scrobbleCollection.getFirst().timestamp;
    const lastScrobbleTimestamp = this.scrobbleCollection.getLast().timestamp;
    const msInDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.ceil((lastScrobbleTimestamp - firstScrobbleTimestamp) / msInDay);
    const perDayCount = Math.round(10 * scrobbleList.length / dayCount) / 10;

    return [
      dayCount,
      perDayCount,
    ];
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

    const firstScrobbleTimestamp = this.scrobbleCollectionZoomed.getFirst().timestamp;
    const lastScrobbleTimestamp = this.scrobbleCollectionZoomed.getLast().timestamp;
    const [maxArtistPlaycount, maxAlbumPlaycount] = this.summaryRegistry.getMaxPlaycounts();

    const plotLeft = plotPadding;
    const plotRight = width - plotPadding;

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
      .domain([firstScrobbleTimestamp, lastScrobbleTimestamp])
      .rangeRound([plotLeft, plotRight]);

    // Y axis
    this.scales.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    // scrobble point color
    this.scales.albumPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxAlbumPlaycount])
      .range(albumPlaycountScaleRange);
  }

  getGenreColorScales() {
    const {genreColors} = config;
    const scales = {};
    const [maxAlbumPlaycount] = this.summaryRegistry.getMaxPlaycounts();

    for (const genre in genreColors) {
      if (!genreColors[genre].length) {
        continue;
      }

      scales[genre] = d3Scale.scaleSequential()
        .domain([1, maxAlbumPlaycount])
        .range(genreColors[genre]);
    }

    return scales;
  }

  getGenreColorByAlbumPlaycount(genre, playcount, toHighlight = false) {
    const {timeline: {point: {colorValueFactors, highlightedColorValueFactors}}} = config;
    const genreColorScale = this.genreColorScales[genre];
    const color = d3Color.hsl(
      genreColorScale
        ? genreColorScale(playcount)
        : d3ScaleChromatic.interpolateGreys(this.scales.albumPlaycountScale(playcount)),
    );

    color.s *= toHighlight
      ? highlightedColorValueFactors.saturation
      : colorValueFactors.saturation;

    color.l *= toHighlight
      ? highlightedColorValueFactors.lightness
      : colorValueFactors.lightness;

    return color;
  }

  highlightArtistScrobbleList(scrobble) {
    const {timeline: {point: {selectedColor: selectedTrackColor}}} = config;
    const {plot, timeAxisLabel} = this.children;
    const {index: highlightedScrobbleGlobalIndex, artist, track} = scrobble;

    this.scrobbleRegistry.getPointList(artist.name).forEach((
      {
        date,
        artist: {genre},
        album: {playcount},
        track: {name},
        index: artistScrobbleGlobalIndex,
        x: xi,
        y: yi,
      },
      artistScrobbleLocalIndex,
    ) => {
      const color = name === track.name
        ? selectedTrackColor
        : this.getGenreColorByAlbumPlaycount(genre, playcount, true);

      plot.drawPoint(xi, yi, color);

      if (artistScrobbleLocalIndex === 0) {
        timeAxisLabel.renderText(xi, plot.getDimensions()[0], date);
      }

      this.scrobbleCollectionHighlighted.push({
        x: xi,
        y: yi,
      });

      if (artistScrobbleGlobalIndex === highlightedScrobbleGlobalIndex) {
        this.selectedScrobble = scrobble;
      }
    });
  }

  removeScrobbleCollectionHighlight() {
    const {plot} = this.children;

    this.scrobbleCollectionHighlighted.getAll().forEach(
      ({x, y}) => plot.drawPoint(x, y, this.scrobbleBuffer.getPoint(x, y).color),
    );
    this.scrobbleCollectionHighlighted.reset();
  }

  selectScrobble(scrobble) {
    const {infoBox} = this.children;

    if (this.toShowIntroMessage) {
      this.hideIntroMessage();
    }

    this.removeScrobbleCollectionHighlight();
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
    this.reset();
    this.draw();
    this.showIntroMessage();
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
    this.showIntroMessage();
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

  // @todo: use "event.deltaX" for horizontal panning, but don't zoom and pan simultaneously
  handlePlotWheel(event) {
    event.preventDefault();

    const {timeline: {zoomDeltaFactor, minTimeRange, plot: {padding: plotPadding}}} = config;
    const {offsetX, deltaY} = event;
    const zoomFactor = 1 - deltaY * zoomDeltaFactor;

    const {scrobbleList} = this.props;
    const {plot} = this.children;
    const [plotWidth] = plot.getDimensions();
    const plotWidthPadded = plotWidth - 2 * plotPadding;

    const firstScrobble = this.scrobbleCollection.getFirst();
    const lastScrobble = this.scrobbleCollection.getLast();
    const firstScrobbleZoomed = this.scrobbleCollectionZoomed.getFirst();
    const lastScrobbleZoomed = this.scrobbleCollectionZoomed.getLast();

    const timeScale = d3Scale.scaleLinear()
      .domain([0, plotWidthPadded])
      .rangeRound([firstScrobbleZoomed.timestamp, lastScrobbleZoomed.timestamp]);
    const xTimestamp = timeScale(clamp(offsetX - plotPadding, 0, plotWidthPadded));
    const xScrobbleTimestamp = (this.scrobbleCollectionZoomed.getPrevious(xTimestamp) || firstScrobbleZoomed).timestamp;

    const leftTimeRange = (xScrobbleTimestamp - firstScrobbleZoomed.timestamp) / zoomFactor;
    const rightTimeRange = (lastScrobbleZoomed.timestamp - xScrobbleTimestamp) / zoomFactor;

    if (leftTimeRange + rightTimeRange < minTimeRange) {
      return;
    }

    const {timeAxisLabel} = this.children;

    const leftScrobble = this.scrobbleCollection.getPrevious(xScrobbleTimestamp - leftTimeRange) || firstScrobble;
    const rightScrobble = this.scrobbleCollection.getNext(xScrobbleTimestamp + rightTimeRange) || lastScrobble;

    this.scrobbleCollectionZoomed = new PointCollection(scrobbleList.slice(leftScrobble.index, rightScrobble.index + 1));
    this.reset();
    timeAxisLabel.clear();
    this.draw();
  }

  showIntroMessage() {
    const {timeAxisLabel, infoBox} = this.children;

    this.toShowIntroMessage = true;
    timeAxisLabel.clear();
    infoBox.showIntroMessage();
  }

  hideIntroMessage() {
    const {infoBox} = this.children;

    this.toShowIntroMessage = false;
    infoBox.hideIntroMessage();
  }

  draw() {
    const {plot} = this.children;

    // subsequent calls depend on plot dimensions
    plot.scale();
    this.initializeScales();
    plot.drawBackground();

    this.scrobbleCollectionZoomed.getAll().forEach((scrobble) => {
      const {timestamp, artist, album} = scrobble;
      const x = this.scales.timeRangeScale(timestamp);
      const y = this.scales.artistPlaycountScale(artist.playcount);
      const color = this.getGenreColorByAlbumPlaycount(artist.genre, album.playcount);
      const point = {
        ...scrobble,
        x,
        y,
        color,
      };

      plot.drawPoint(x, y, color);
      this.scrobbleBuffer.putPoint(point);
      this.scrobbleRegistry.putPoint(point);
    });

    plot.drawTimeAxis(...this.scales.timeRangeScale.range());
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
    const {plot, timeAxisLabel, infoBox} = this.children;

    return html`
      <main>
        ${plot.render()}
        ${timeAxisLabel.render()}
        ${infoBox.render()}
      </main>
    `;
  }
}
