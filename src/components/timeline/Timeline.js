import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import html from '../../lib/html';

import config from '../../config';
import cssColors from '../../app-theme';
import {dateStringToTimestamp} from '../../utils/date';

import './Timeline.css';

// @todo:
// * show a date of the first scrobble for highlighted artist (render it below the time axis)
// * expand summary - add total numbers (artists, albums, tracks, scrobbles)

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
    };
  }

  constructor(props) {
    this.props = {
      ...this.constructor.getDefaultProps(),
      ...props,
    };

    const {scrobbleSize} = this.props;

    this.introMessageElementList = null;
    this.dateElement = null;
    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;

    this.canvasDimensions = null;
    this.canvasElement = null;
    this.ctx = null;

    this.timeRangeScale = null;
    this.artistPlaycountScale = null;
    this.albumPlaycountScale = null;

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.scrobbleBuffer = {}; // [y][x] matrix (y-coord is first because of horizontal traversal optimization)
    this.scrobbleHighlightPointList = []; // [x1, y1, x2, y2, ...]
    this.scrobbleArtistRegistry = {};
    this.highlightedScrobble = null;
    this.isFirstDraw = true;
    this.toShowIntroMessage = true;

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
  }

  reset() {
    this.scrobbleBuffer = {};
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
    this.introMessageElementList = document.querySelectorAll('.Timeline__info-box-field--intro-message');
    this.dateElement = document.getElementById('date');
    this.artistNameElement = document.getElementById('artist-name');
    this.albumNameElement = document.getElementById('album-name');
    this.trackNameElement = document.getElementById('track-name');
    this.canvasElement = document.getElementById('canvas');
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

  initializeScales() {
    const {scrobbleList, plotPadding, scrobbleSize, timeAxisWidth, scrobbleMargin} = this.props;
    const [width, height] = this.canvasDimensions;

    const minDateTimestamp = dateStringToTimestamp(scrobbleList[0].date);
    const maxDateTimestamp = dateStringToTimestamp(scrobbleList[scrobbleList.length - 1].date);

    const maxArtistPlaycount = Math.max(...scrobbleList.map(({artist}) => artist.playcount));
    const maxAlbumPlaycount = Math.max(...scrobbleList.map(({album}) => album.playcount));

    const scrobbleAreaLeft = plotPadding;
    const scrobbleAreaRight = width - plotPadding;
    const scrobbleAreaBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const scrobbleAreaHeight = Math.min(
      scrobbleAreaBottom - plotPadding,
      (maxArtistPlaycount - 1) * (scrobbleSize + scrobbleMargin),
    );
    const scrobbleAreaTop = scrobbleAreaBottom - scrobbleAreaHeight;

    this.timeRangeScale = d3Scale.scaleLinear()
      .domain([minDateTimestamp, maxDateTimestamp])
      .rangeRound([scrobbleAreaLeft, scrobbleAreaRight]);

    this.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([scrobbleAreaBottom, scrobbleAreaTop]);

    this.albumPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxAlbumPlaycount])
      .range([0.8, 0.4]);
  }

  plotScrobbleOnBuffer(x, y, scrobble, index, color) {
    if (!this.scrobbleBuffer[y]) {
      this.scrobbleBuffer[y] = {};
    }

    this.scrobbleBuffer[y][x] = {
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
      yBuffer = this.scrobbleBuffer[yi];

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
    const yBuffer = this.scrobbleBuffer[y];
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
    const [width, height] = this.canvasDimensions;

    this.ctx.strokeStyle = colors.timeAxis;
    this.ctx.lineWidth = timeAxisWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(
      plotPadding,
      height - plotPadding,
    );
    this.ctx.lineTo(
      width - plotPadding,
      height - plotPadding,
    );
    this.ctx.stroke();
  }

  drawScrobbleList() {
    const {scrobbleList} = this.props;

    scrobbleList.forEach((scrobble, index) => {
      const {date, artist, album} = scrobble;
      const x = this.timeRangeScale(dateStringToTimestamp(date));
      const y = this.artistPlaycountScale(artist.playcount);
      const color = this.getColorByAlbumPlaycount(album.playcount);

      this.drawScrobblePoint(x, y, color);
      this.plotScrobbleOnBuffer(x, y, scrobble, index, color);
      this.putScrobbleIntoArtistRegistry(x, y, scrobble, index);
    });
  }

  drawArtistScrobbleListHighlight(scrobble) {
    const {colors} = this.props;
    const {index, artist, track} = scrobble;

    this.getScrobbleListForArtist(artist.name).forEach(({
      album: {playcount},
      track: {name},
      index: i,
      x: xi,
      y: yi,
    }) => {
      const color = name === track.name
        ? colors.scrobbleHighlight
        : this.getHighlightColorByAlbumPlaycount(playcount);

      this.drawScrobblePoint(xi, yi, color);
      this.scrobbleHighlightPointList.push(xi, yi);

      if (i === index) {
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
    this.removeScrobbleHighlight();
    this.drawArtistScrobbleListHighlight(scrobble);
    this.renderInfoBoxContent(scrobble);
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
    this.toShowIntroMessage = true;
    this.introMessageElementList.forEach((element) => element.style.display = 'block');
    [
      this.dateElement,
      this.artistNameElement,
      this.albumNameElement,
      this.trackNameElement,
    ].forEach((element) => element.innerText = '');
  }

  hideIntroMessage() {
    this.toShowIntroMessage = false;
    this.introMessageElementList.forEach((element) => element.style.display = 'none');
  }

  renderInfoBoxContent({date, artist, album, track}) {
    if (this.toShowIntroMessage) {
      this.hideIntroMessage();
    }

    this.dateElement.innerText = `date: ${date}`;

    // @todo: add last.fm links
    // @see: "url``" from "music-stats/map/src/utils/string.ts"
    this.artistNameElement.innerHTML = html`<span>artist: ${artist.name} <small>(${artist.playcount})</small></span>`;
    this.albumNameElement.innerHTML = html`<span>album: ${album.name} <small>(${album.playcount})</small></span>`;
    this.trackNameElement.innerHTML = html`<span>track: ${track.name} <small>(${track.playcount})</small></span>`;
  }

  draw() {
    if (this.isFirstDraw) {
      this.isFirstDraw = false;
      this.initializeElements();
      this.subscribe();
    }

    this.initializeCanvasContext();
    this.initializeScales();

    this.drawBackground();
    this.drawScrobbleList();
    this.drawTimeAxis();
  }

  render() {
    const {links} = config;

    return html`
      <main
        class="Timeline"
      >
        <canvas
          id="canvas"
          class="Timeline__chart"
        />

        <aside
          class="Timeline__info-box"
        >
          <p
            class="Timeline__info-box-field Timeline__info-box-field--intro-message"
          >
            Last.fm: <a href=${links.lastfm.url}>${links.lastfm.text}</a>
          </p>

          <p
            class="Timeline__info-box-field Timeline__info-box-field--intro-message"
          >
            GitHub: <a href=${links.github.url}>${links.github.text}</a>
          </p>

          <p
            class="Timeline__info-box-field Timeline__info-box-field--intro-message"
          >
            Twitter: <a href=${links.twitter.url}>${links.twitter.text}</a>
          </p>

          <p
            class="Timeline__info-box-field Timeline__info-box-field--intro-message"
          >
            (hover over a scrobble and use arrow keys for navigation)
          </p>

          <p
            id="date"
            class="Timeline__info-box-field"
          />

          <p
            id="artist-name"
            class="Timeline__info-box-field"
          />

          <p
            id="album-name"
            class="Timeline__info-box-field"
          />

          <p
            id="track-name"
            class="Timeline__info-box-field"
          />
        </aside>
      </main>
    `;
  }
}
