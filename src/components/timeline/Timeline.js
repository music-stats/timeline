import * as d3Scale from 'd3-scale';
import html from '../../lib/html';

import config from '../../config';
import cssColors from '../../app-theme';
import {dateStringToTimestamp} from '../../utils/date';

import './Timeline.css';

// @todo:
// * use left/right arrow keys for navigating to previous/next scrobbles with the same artist playcount
// * highlight the same album (use a pale color) when highlighting a scrobble
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
        background: cssColors.darkBlue,
        scrobble: cssColors.darkGrey2,
        artistHighlight: cssColors.grey1,
        scrobbleHighlight: cssColors.lightGrey3,
        timeAxis: cssColors.grey1,
      },
    };
  }

  constructor(props) {
    this.props = {
      ...this.constructor.getDefaultProps(),
      ...props,
    };

    const {scrobbleList, scrobbleSize} = this.props;
    const {width, height} = document.body.getBoundingClientRect();

    this.toShowIntroMessage = true;

    this.introMessageElementList = null;
    this.dateElement = null;
    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;

    // @todo: listen to "window.resize" for updating dimensions and scales
    this.canvasDimensions = [width, height];
    this.canvasElement = null;
    this.ctx = null;

    this.artistPlaycountList = scrobbleList.map(({artist}) => artist.playcount);
    this.timeRangeScale = null;
    this.artistPlaycountScale = null;

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.scrobbleBuffer = {};
    this.scrobbleHighlightPointList = [];
    this.scrobbleArtistRegistry = {};
    this.highlightedScrobbleIndex = null;

    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
  }

  subscribe() {
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
    const [width, height] = this.canvasDimensions;

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

    const minPlaycount = 1;
    const maxPlaycount = Math.max(...this.artistPlaycountList);

    const scrobbleAreaLeft = plotPadding;
    const scrobbleAreaRight = width - plotPadding;

    // All those "scrobbleAreaHeight" calculations are needed
    // to guarantee equal vertical distances between points (aka margins).
    // Since rounded range is used for vertical (playcount) scale,
    // the range itself should be aliquot to point size + margin.
    const scrobbleAreaBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const plotAreaHeight = scrobbleAreaBottom - plotPadding;
    const scrobbleAreaHeight = plotAreaHeight - plotAreaHeight % ((maxPlaycount - 1) * (scrobbleSize + scrobbleMargin));
    const scrobbleAreaTop = scrobbleAreaHeight > 0
      ? scrobbleAreaBottom - scrobbleAreaHeight
      : plotPadding;

    this.timeRangeScale = d3Scale.scaleLinear()
      .domain([
        minDateTimestamp,
        maxDateTimestamp,
      ])
      .rangeRound([
        scrobbleAreaLeft,
        scrobbleAreaRight,
      ]);

    this.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([
        minPlaycount,
        maxPlaycount,
      ])
      .rangeRound([
        scrobbleAreaBottom,
        scrobbleAreaTop,
      ]);
  }

  plotScrobbleOnBuffer(x, y, scrobble, index) {
    if (!this.scrobbleBuffer[x]) {
      this.scrobbleBuffer[x] = {};
    }

    this.scrobbleBuffer[x][y] = {
      ...scrobble,
      index,
    };
  }

  getPlottedScrobbleFromBuffer(x, y) {
    const xFrom = x - this.scrobbleHalfSize;
    const xTo = x + this.scrobbleHalfSize;
    const yFrom = y - this.scrobbleHalfSize;
    const yTo = y + this.scrobbleHalfSize;
    let xBuffer = null;
    let scrobble = null;

    for (let xi = xFrom; xi <= xTo; xi += 1) {
      xBuffer = this.scrobbleBuffer[xi];

      if (xBuffer) {
        for (let yj = yFrom; yj <= yTo; yj += 1) {
          scrobble = xBuffer[yj];

          if (scrobble) {
            return scrobble;
          }
        }
      }
    }

    return null;
  }

  putScrobbleIntoArtistRegistry(x, y, scrobble) {
    const {artist: {name}} = scrobble;

    if (!this.scrobbleArtistRegistry[name]) {
      this.scrobbleArtistRegistry[name] = [];
    }

    this.scrobbleArtistRegistry[name].push({
      ...scrobble,
      x,
      y,
    });
  }

  getScrobblesForArtist(artistName) {
    return this.scrobbleArtistRegistry[artistName];
  }

  drawBackground() {
    const {colors} = this.props;
    const [width, height] = this.canvasDimensions;

    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawScrobbleList() {
    const {scrobbleList, colors} = this.props;

    this.ctx.fillStyle = colors.scrobble;
    scrobbleList.forEach(this.drawScrobble, this);
  }

  drawScrobble(scrobble, index) {
    const {date, artist} = scrobble;
    const x = this.timeRangeScale(dateStringToTimestamp(date));
    const y = this.artistPlaycountScale(artist.playcount);

    this.drawScrobblePoint(x, y);
    this.plotScrobbleOnBuffer(x, y, scrobble, index);
    this.putScrobbleIntoArtistRegistry(x, y, scrobble);
  }

  drawScrobbleHighlight(scrobble) {
    const {colors} = this.props;
    const {index, artist, track} = scrobble;

    this.removeScrobbleHighlight();
    this.highlightedScrobbleIndex = index;

    this.getScrobblesForArtist(artist.name).forEach(({track: {name}, x: xi, y: yi}) => {
      this.ctx.fillStyle = name === track.name
        ? colors.scrobbleHighlight
        : colors.artistHighlight;
      this.drawScrobblePoint(xi, yi);
      this.scrobbleHighlightPointList.push(xi, yi);
    });
  }

  removeScrobbleHighlight() {
    if (!this.scrobbleHighlightPointList.length) {
      return;
    }

    const {colors} = this.props;

    this.ctx.fillStyle = colors.scrobble;

    for (let i = 0; i < this.scrobbleHighlightPointList.length - 1; i += 2) {
      this.drawScrobblePoint(
        this.scrobbleHighlightPointList[i],
        this.scrobbleHighlightPointList[i + 1],
      );
    }

    this.scrobbleHighlightPointList = [];
  }

  drawScrobblePoint(x, y) {
    const {scrobbleSize} = this.props;

    this.ctx.fillRect(
      x - this.scrobbleHalfSize,
      y - this.scrobbleHalfSize,
      scrobbleSize,
      scrobbleSize,
    );
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

  selectHighlightedScrobble() {
    const {scrobbleList} = this.props;

    this.selectScrobble({
      ...scrobbleList[this.highlightedScrobbleIndex],
      index: this.highlightedScrobbleIndex,
    });
  }

  selectScrobble(scrobble) {
    this.drawScrobbleHighlight(scrobble);
    this.renderInfoBoxContent(scrobble);
  }

  handleDocumentKeydown(event) {
    switch (event.key) {
      case 'Escape':
        return this.handleEscKeydown();

      case 'ArrowUp':
        return this.handleArrowUpKeydown();

      case 'ArrowDown':
        return this.handleArrowDownKeydown();
    }
  }

  handleEscKeydown() {
    this.highlightedScrobbleIndex = null;
    this.removeScrobbleHighlight();
    this.showIntroMessage();
  }

  handleArrowUpKeydown() {
    const {scrobbleList} = this.props;

    if (
      this.highlightedScrobbleIndex !== null &&
      this.highlightedScrobbleIndex < scrobbleList.length - 1
    ) {
      this.highlightedScrobbleIndex += 1;
      this.selectHighlightedScrobble();
    }
  }

  handleArrowDownKeydown() {
    // neither null nor 0
    if (this.highlightedScrobbleIndex) {
      this.highlightedScrobbleIndex -= 1;
      this.selectHighlightedScrobble();
    }
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
    this.initializeElements();
    this.initializeCanvasContext();
    this.initializeScales();
    this.subscribe();

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
