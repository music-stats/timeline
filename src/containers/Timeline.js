import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import html from '../lib/html';

import config from '../config';
import {dateTimeStringToTimestamp, dataTimeStringToDateString} from '../utils/date';

import PointCollection from '../stores/PointCollection';
import PointBuffer from '../stores/PointBuffer';
import PointRegistry from '../stores/PointRegistry';
import SummaryRegistry from '../stores/SummaryRegistry';

import Plot from '../components/Plot';
import TimeAxisLabel from '../components/TimeAxisLabel';
import InfoBox from '../components/InfoBox';

// @todo:
// * add unit tests (use "tape")

export default class Timeline {
  constructor(props) {
    const {timeline: {point: {size: scrobbleSize}}} = config;
    const {scrobbleList} = props;

    this.props = props;
    this.children = {};
    this.scales = {};

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.selectedScrobble = null;
    this.toShowIntroMessage = true;

    this.scrobbleCollection = new PointCollection(scrobbleList);
    this.highlightedScrobbleCollection = new PointCollection();
    this.scrobbleBuffer = new PointBuffer(this.scrobbleHalfSize);
    this.scrobbleRegistry = new PointRegistry(({artist: {name}}) => name);
    this.summaryRegistry = new SummaryRegistry(scrobbleList);

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handlePlotMouseMove = this.handlePlotMouseMove.bind(this);
  }

  reset() {
    this.scrobbleBuffer.reset();
    this.scrobbleRegistry.reset();
    this.highlightedScrobbleCollection.reset();
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
    });

    this.children.timeAxisLabel = new TimeAxisLabel();

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: dataTimeStringToDateString(this.scrobbleCollection.getFirst().date),
        lastScrobbleDate: dataTimeStringToDateString(this.scrobbleCollection.getLast().date),
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
    const firstScrobbleDateTimestamp = dateTimeStringToTimestamp(this.scrobbleCollection.getFirst().date);
    const lastScrobbleDateTimestamp = dateTimeStringToTimestamp(this.scrobbleCollection.getLast().date);
    const msInDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.ceil((lastScrobbleDateTimestamp - firstScrobbleDateTimestamp) / msInDay);
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

    const {scrobbleList} = this.props;
    const {plot} = this.children;
    const [width, height] = plot.getDimensions();

    const firstScrobbleDateTimestamp = dateTimeStringToTimestamp(this.scrobbleCollection.getFirst().date);
    const lastScrobbleDateTimestamp = dateTimeStringToTimestamp(this.scrobbleCollection.getLast().date);
    const [maxArtistPlaycount, maxAlbumPlaycount] = this.summaryRegistry.getMaxPlaycounts();

    // plot width calculation avoids stretching the timeline in case of few points
    const plotLeft = plotPadding;
    const plotWidth = Math.min(
      width - 2 * plotPadding,
      scrobbleList.length * scrobbleSize,
    );
    const plotRight = plotPadding + plotWidth;

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
      .domain([firstScrobbleDateTimestamp, lastScrobbleDateTimestamp])
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

  getColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateGreys(this.scales.albumPlaycountScale(playcount));
  }

  getHighlightColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateWarm(this.scales.albumPlaycountScale(playcount));
  }

  highlightArtistScrobbleList(scrobble) {
    const {timeline: {point: {selectedColor: selectedTrackColor}}} = config;
    const {plot, timeAxisLabel} = this.children;
    const {index: highlightedScrobbleGlobalIndex, artist, track} = scrobble;

    this.scrobbleRegistry.getPointList(artist.name).forEach((
      {
        date,
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
        : this.getHighlightColorByAlbumPlaycount(playcount);

      plot.drawPoint(xi, yi, color);

      if (artistScrobbleLocalIndex === 0) {
        timeAxisLabel.renderText(xi, plot.getDimensions()[0], date);
      }

      this.highlightedScrobbleCollection.push({
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

    this.highlightedScrobbleCollection.getAll().forEach(
      ({x, y}) => plot.drawPoint(x, y, this.scrobbleBuffer.getPoint(x, y).color),
    );
    this.highlightedScrobbleCollection.reset();
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
      const adjacentScrobble = this.scrobbleCollection.getAdjacent(scrobble, shift);

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  selectHorizontallyAdjacentScrobble(scrobble, shift) {
    if (scrobble) {
      const {artist: {playcount}} = scrobble;
      const adjacentScrobble = this.scrobbleCollection.getAdjacent(
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
    const {scrobbleList} = this.props;
    const {plot} = this.children;

    // subsequent calls depend on plot dimensions
    plot.scale();
    this.initializeScales();
    plot.drawBackground();

    scrobbleList.forEach((scrobble, index) => {
      const {date, artist, album} = scrobble;
      const x = this.scales.timeRangeScale(dateTimeStringToTimestamp(date));
      const y = this.scales.artistPlaycountScale(artist.playcount);
      const color = this.getColorByAlbumPlaycount(album.playcount);
      const point = {
        ...scrobble,
        x,
        y,
        index,
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