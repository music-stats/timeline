import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import html from '../../lib/html';

import config from '../../config';
import cssColors from '../../app-theme';
import {dateTimeStringToTimestamp, dataTimeStringToDateString} from '../../utils/date';
import TimelineInfoBox from './TimelineInfoBox';

import './Timeline.css';

// @todo:
// * split this big class into:
//   * <Timeline /> - the main component
//   * <Plot /> - only canvas drawing
//   * <ScrobbleDate /> - positioning and styling of a given date
//   * <InfoBox /> - summary and scrobble info
// * add unit tests (use "tape")

export default class Timeline {
  static getDefaultProps() {
    return {
      plotPadding: 20,
      scrobbleSize: 4,
      scrobbleMargin: 2,
      timeAxisWidth: 2,
      colors: {
        background: cssColors.darkGreyBlue,
        scrobble: cssColors.darkGrey2,
        scrobbleHighlight: cssColors.white,
        timeAxis: cssColors.grey1,
      },
      colorRanges: {
        albumPlaycount: {
          from: 0.8,
          to: 0.4,
        },
      },
    };
  }

  constructor(props) {
    this.props = {
      ...this.constructor.getDefaultProps(),
      ...props,
    };
    this.children = {};

    const {scrobbleSize} = this.props;

    this.firstArtistScrobbleDateElement = null;

    this.canvasDimensions = null;
    this.canvasElement = null;
    this.ctx = null;

    this.timeRangeScale = null;
    this.artistPlaycountScale = null;
    this.albumPlaycountScale = null;

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.scrobbleTotalRegistry = null;
    this.scrobbleSummary = null;
    this.scrobblePlotBuffer = {}; // [y][x] matrix (y-coord is first because of horizontal traversal optimization)
    this.scrobbleHighlightPointList = []; // [x1, y1, x2, y2, ...]
    this.scrobbleArtistRegistry = {};
    this.highlightedScrobble = null;
    this.toShowIntroMessage = true;

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
  }

  reset() {
    this.scrobblePlotBuffer = {};
    this.scrobbleHighlightPointList = [];
    this.scrobbleArtistRegistry = {};
    this.highlightedScrobble = null;
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
    this.canvasElement.addEventListener('mousemove', this.handleCanvasMouseMove);
  }

  initializeElements() {
    this.firstArtistScrobbleDateElement = document.getElementById('first-artist-scrobble-date');
    this.canvasElement = document.getElementById('canvas');
  }

  initializeChildrenComponents() {
    const {scrobbleList} = this.props;
    const {links} = config;
    const firstScrobbleDate = dataTimeStringToDateString(scrobbleList[0].date);
    const lastScrobbleDate = dataTimeStringToDateString(scrobbleList[scrobbleList.length - 1].date);
    const [dayCount, perDayCount] = this.getPeriodCounts();
    const {artistCount, albumCount, trackCount} = this.scrobbleSummary;
    const scrobbleCount = scrobbleList.length;

    this.children.infoBox = new TimelineInfoBox({
      links,
      dates: {
        firstScrobbleDate,
        lastScrobbleDate,
      },
      counts: {
        artistCount,
        albumCount,
        trackCount,
        scrobbleCount,
        dayCount,
        perDayCount,
      },
    });
  }

  initializeCanvasContext() {
    const dpr = window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvasDimensions = [width, height];

    this.canvasElement.width = width * dpr;
    this.canvasElement.height = height * dpr;
    this.canvasElement.style.width = `${width}px`;
    this.canvasElement.style.height = `${height}px`;

    this.ctx = this.canvasElement.getContext('2d', {alpha: false});
    this.ctx.scale(dpr, dpr);
  }

  initializeTotals() {
    const {scrobbleList} = this.props;
    const registry = {};
    const summary = {
      artistCount: 0,
      albumCount: 0,
      trackCount: 0,
    };

    scrobbleList.forEach(({artist, album, track}) => {
      if (!registry[artist.name]) {
        // The same track can appear on different albums, so track playcount values are not nested into albums.
        // It matches aggregation logic in "music-stats/scripts/src/ETL/transformers/aggregate.ts".
        registry[artist.name] = {
          albums: {},
          tracks: {},
        };
      }

      registry[artist.name].playcount = artist.playcount;
      registry[artist.name].albums[album.name] = album.playcount;
      registry[artist.name].tracks[track.name] = track.playcount;
    });

    summary.artistCount = Object.keys(registry).length;

    for (const artistName in registry) {
      const artistRecord = registry[artistName];

      summary.albumCount += Object.keys(artistRecord.albums).length;
      summary.trackCount += Object.keys(artistRecord.tracks).length;
    }

    this.scrobbleTotalRegistry = registry;
    this.scrobbleSummary = summary;
  }

  getMaxPlaycounts() {
    let artistRecord = null;
    let artistPlaycount = null;
    let albumPlaycount = null;
    let maxArtistPlaycount = 0;
    let maxAlbumPlaycount = 0;

    for (const artistName in this.scrobbleTotalRegistry) {
      artistRecord = this.scrobbleTotalRegistry[artistName];
      artistPlaycount = artistRecord.playcount;

      if (artistPlaycount > maxArtistPlaycount) {
        maxArtistPlaycount = artistPlaycount;
      }

      for (const albumName in artistRecord.albums) {
        albumPlaycount = artistRecord.albums[albumName];

        if (albumPlaycount > maxAlbumPlaycount) {
          maxAlbumPlaycount = albumPlaycount;
        }
      }
    }

    return [
      maxArtistPlaycount,
      maxAlbumPlaycount,
    ];
  }

  getScrobbleTotals({artist, album, track}) {
    const artistRecord = this.scrobbleTotalRegistry[artist.name];

    return [
      artistRecord.playcount,
      artistRecord.albums[album.name],
      artistRecord.tracks[track.name],
    ];
  }

  getPeriodCounts() {
    const {scrobbleList} = this.props;
    const firstScrobbleDateTimestamp = dateTimeStringToTimestamp(scrobbleList[0].date);
    const lastScrobbleDateTimestamp = dateTimeStringToTimestamp(scrobbleList[scrobbleList.length - 1].date);
    const msInDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.ceil((lastScrobbleDateTimestamp - firstScrobbleDateTimestamp) / msInDay);
    const perDayCount = Math.round(10 * scrobbleList.length / dayCount) / 10;

    return [
      dayCount,
      perDayCount,
    ];
  }

  initializeScales() {
    const {scrobbleList, plotPadding, scrobbleSize, timeAxisWidth, scrobbleMargin, colorRanges} = this.props;
    const [width, height] = this.canvasDimensions;

    const minDateTimestamp = dateTimeStringToTimestamp(scrobbleList[0].date);
    const maxDateTimestamp = dateTimeStringToTimestamp(scrobbleList[scrobbleList.length - 1].date);
    const [maxArtistPlaycount, maxAlbumPlaycount] = this.getMaxPlaycounts();

    // plot width calculation avoids stretching the timeline in case of few points
    const plotLeft = plotPadding;
    const plotWidth = Math.min(
      width - 2 * plotPadding,
      scrobbleList.length * scrobbleSize,
    );
    const plotRight = plotPadding + plotWidth;

    // plot height calculation is ensuring equal vertical gaps between points
    const plotBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const plotHeight = Math.min(
      plotBottom - plotPadding,
      (maxArtistPlaycount - 1) * (scrobbleSize + scrobbleMargin),
    );
    const plotTop = plotBottom - plotHeight;

    // X axis
    this.timeRangeScale = d3Scale.scaleLinear()
      .domain([minDateTimestamp, maxDateTimestamp])
      .rangeRound([plotLeft, plotRight]);

    // Y axis
    this.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    // scrobble point color
    this.albumPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxAlbumPlaycount])
      .range([colorRanges.albumPlaycount.from, colorRanges.albumPlaycount.to]);
  }

  plotScrobbleOnBuffer(x, y, scrobble, index, color) {
    if (!this.scrobblePlotBuffer[y]) {
      this.scrobblePlotBuffer[y] = {};
    }

    this.scrobblePlotBuffer[y][x] = {
      ...scrobble,
      index,
      color,
    };
  }

  getPlottedScrobbleFromBuffer(x, y) {
    const xFrom = x - this.scrobbleHalfSize;
    const xTo = x + this.scrobbleHalfSize;
    const yFrom = y - this.scrobbleHalfSize;
    const yTo = y + this.scrobbleHalfSize;
    let yBuffer = null;
    let scrobble = null;

    for (let yi = yFrom; yi <= yTo; yi += 1) {
      yBuffer = this.scrobblePlotBuffer[yi];

      if (yBuffer) {
        for (let xj = xFrom; xj <= xTo; xj += 1) {
          scrobble = yBuffer[xj];

          if (scrobble) {
            return scrobble;
          }
        }
      }
    }

    return null;
  }

  getHorizontallyAdjacentScrobbleFromBuffer({x, y}, shift) {
    const yBuffer = this.scrobblePlotBuffer[y];
    const xList = Object.keys(yBuffer);
    const prevX = xList[xList.indexOf(String(x)) + shift];

    return yBuffer[prevX];
  }

  putScrobbleIntoArtistRegistry(x, y, scrobble, index) {
    const {artist: {name}} = scrobble;

    if (!this.scrobbleArtistRegistry[name]) {
      this.scrobbleArtistRegistry[name] = [];
    }

    this.scrobbleArtistRegistry[name].push({
      ...scrobble,
      index,
      x,
      y,
    });
  }

  getScrobbleListForArtist(artistName) {
    return this.scrobbleArtistRegistry[artistName];
  }

  getColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateGreys(this.albumPlaycountScale(playcount));
  }

  getHighlightColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateWarm(this.albumPlaycountScale(playcount));
  }

  drawBackground() {
    const {colors} = this.props;
    const [width, height] = this.canvasDimensions;

    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawTimeAxis() {
    const {plotPadding, timeAxisWidth, colors} = this.props;
    const height = this.canvasDimensions[1];
    const [xFrom, xTo] = this.timeRangeScale.range();
    const y = height - plotPadding;

    this.ctx.strokeStyle = colors.timeAxis;
    this.ctx.lineWidth = timeAxisWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(xFrom, y);
    this.ctx.lineTo(xTo, y);
    this.ctx.stroke();
  }

  drawScrobbleList() {
    const {scrobbleList} = this.props;

    scrobbleList.forEach((scrobble, index) => {
      const {date, artist, album} = scrobble;
      const x = this.timeRangeScale(dateTimeStringToTimestamp(date));
      const y = this.artistPlaycountScale(artist.playcount);
      const color = this.getColorByAlbumPlaycount(album.playcount);

      this.drawScrobblePoint(x, y, color);
      this.plotScrobbleOnBuffer(x, y, scrobble, index, color);
      this.putScrobbleIntoArtistRegistry(x, y, scrobble, index);
    });
  }

  drawArtistScrobbleListHighlight(scrobble) {
    const {colors} = this.props;
    const {index: highlightedScrobbleGlobalIndex, artist, track} = scrobble;

    this.getScrobbleListForArtist(artist.name).forEach((
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
        ? colors.scrobbleHighlight
        : this.getHighlightColorByAlbumPlaycount(playcount);

      this.drawScrobblePoint(xi, yi, color);
      this.scrobbleHighlightPointList.push(xi, yi);

      if (artistScrobbleLocalIndex === 0) {
        this.renderFirstArtistScrobbleDate(xi, date);
      }

      if (artistScrobbleGlobalIndex === highlightedScrobbleGlobalIndex) {
        this.highlightedScrobble = {
          ...scrobble,
          x: xi,
          y: yi,
        };
      }
    });
  }

  removeScrobbleHighlight() {
    if (!this.scrobbleHighlightPointList.length) {
      return;
    }

    for (let i = 0; i < this.scrobbleHighlightPointList.length - 1; i += 2) {
      const x = this.scrobbleHighlightPointList[i];
      const y = this.scrobbleHighlightPointList[i + 1];
      const {color} = this.getPlottedScrobbleFromBuffer(x, y);

      this.drawScrobblePoint(x, y, color);
    }

    this.scrobbleHighlightPointList = [];
  }

  drawScrobblePoint(x, y, color) {
    const {scrobbleSize} = this.props;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - this.scrobbleHalfSize,
      y - this.scrobbleHalfSize,
      scrobbleSize,
      scrobbleSize,
    );
  }

  selectScrobble(scrobble) {
    if (this.toShowIntroMessage) {
      this.hideIntroMessage();
    }

    this.removeScrobbleHighlight();
    this.drawArtistScrobbleListHighlight(scrobble);
    this.renderScrobbleInfo(scrobble);
  }

  selectVerticallyAdjacentScrobble(scrobble, shift) {
    const {scrobbleList} = this.props;
    const condition = shift > 0
      ? () => scrobble && scrobble.index < scrobbleList.length - 1
      : () => scrobble && scrobble.index > 0;

    if (condition()) {
      const index = scrobble.index + shift;

      this.selectScrobble({
        ...scrobbleList[index],
        index,
      });
    }
  }

  selectHorizontallyAdjacentScrobble(scrobble, shift) {
    if (scrobble) {
      const adjacentScrobble = this.getHorizontallyAdjacentScrobbleFromBuffer(scrobble, shift);

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
    this.highlightedScrobble = null;
    this.removeScrobbleHighlight();
    this.showIntroMessage();
  }

  handleArrowDownKeydown() {
    this.selectVerticallyAdjacentScrobble(this.highlightedScrobble, -1);
  }

  handleArrowUpKeydown() {
    this.selectVerticallyAdjacentScrobble(this.highlightedScrobble, 1);
  }

  handleArrowLeftKeydown() {
    this.selectHorizontallyAdjacentScrobble(this.highlightedScrobble, -1);
  }

  handleArrowRightKeydown() {
    this.selectHorizontallyAdjacentScrobble(this.highlightedScrobble, 1);
  }

  handleCanvasMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.getPlottedScrobbleFromBuffer(x, y);

    if (scrobble) {
      this.selectScrobble(scrobble);
    }
  }

  showIntroMessage() {
    const {infoBox} = this.children;

    this.toShowIntroMessage = true;
    this.firstArtistScrobbleDateElement.innerText = '';
    infoBox.showIntroMessage();
  }

  hideIntroMessage() {
    const {infoBox} = this.children;

    this.toShowIntroMessage = false;
    infoBox.hideIntroMessage();
  }

  renderFirstArtistScrobbleDate(x, date) {
    const {plotPadding, scrobbleMargin: margin} = this.props;
    const [canvasWidth] = this.canvasDimensions;

    this.firstArtistScrobbleDateElement.innerText = date;

    const {offsetWidth: width} = this.firstArtistScrobbleDateElement;
    const halfWidth = Math.ceil(width / 2);
    const [left, right] = (() => {
      // stick to left
      if (x - halfWidth < margin) {
        return [`${margin}px`, 'auto'];
      }

      // stick to right
      if (x + halfWidth > canvasWidth - margin) {
        return ['auto', `${margin}px`];
      }

      // center under "x"
      return [`${x - halfWidth}px`, 'auto'];
    })();

    this.firstArtistScrobbleDateElement.style.top = `calc(100vh - ${plotPadding - margin}px)`;
    this.firstArtistScrobbleDateElement.style.left = left;
    this.firstArtistScrobbleDateElement.style.right = right;
  }

  renderScrobbleInfo(scrobble) {
    const {infoBox} = this.children;

    infoBox.renderScrobbleInfo({
      scrobble,
      totals: this.getScrobbleTotals(scrobble),
    });
  }

  // everything inside this method depends on canvas dimensions
  draw() {
    this.initializeCanvasContext();
    this.initializeScales();

    this.drawBackground();
    this.drawScrobbleList();
    this.drawTimeAxis();
  }

  // things needed for the first render
  beforeRender() {
    this.initializeTotals();
    this.initializeChildrenComponents();
  }

  // things to initialize after the first render
  afterRender() {
    this.initializeElements();
    this.children.infoBox.initializeElements();
    this.subscribe();
  }

  render() {
    const {infoBox} = this.children;

    return html`
      <main
        class="Timeline"
      >
        <canvas
          id="canvas"
          class="Timeline__chart"
        />

        <aside
          id="first-artist-scrobble-date"
          class="Timeline__x-axis-caption"
        >
        </aside>

        ${infoBox.render()}
      </main>
    `;
  }
}
