import * as d3Scale from 'd3-scale';
import html from '../../lib/html';

import cssColors from '../../app-theme';
import {dateStringToTimestamp} from '../../utils/date';

import './Timeline.css';

export default class Timeline {
  static getDefaultProps() {
    return {
      infoBoxHeight: 200,
      timeAxisOffset: 20,
      scrobbleSize: 4,
    };
  }

  constructor(props) {
    this.props = {
      ...this.constructor.getDefaultProps(),
      ...props,
    };

    const {scrobbleList, infoBoxHeight, scrobbleSize} = this.props;
    const {width, height} = document.body.getBoundingClientRect();

    this.dateElement = null;
    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;

    // @todo: listen to "window.resize" for updating dimensions and scales
    this.canvasDimensions = [width, height - infoBoxHeight];
    this.canvasElement = null;
    this.ctx = null;

    this.artistPlaycountList = scrobbleList.map(({artist}) => artist.playcount);
    this.timeRangeScale = null;
    this.artistPlaycountScale = null;

    this.scrobbleOffset = scrobbleSize / 2;
    this.scrobbleBuffer = {};

    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
  }

  initializeElements() {
    const dpr = window.devicePixelRatio;
    const [width, height] = this.canvasDimensions;

    this.dateElement = document.getElementById('date');
    this.artistNameElement = document.getElementById('artist-name');
    this.albumNameElement = document.getElementById('album-name');
    this.trackNameElement = document.getElementById('track-name');

    this.canvasElement = document.getElementById('canvas');
    this.canvasElement.width = width * dpr;
    this.canvasElement.height = height * dpr;
    this.canvasElement.style.width = `${width}px`;
    this.canvasElement.style.height = `${height}px`;
    this.canvasElement.addEventListener('mousemove', this.handleCanvasMouseMove);

    this.ctx = this.canvasElement.getContext('2d', {alpha: false});
    this.ctx.scale(dpr, dpr);
  }

  initializeScales() {
    const {scrobbleList, timeAxisOffset} = this.props;
    const [width, height] = this.canvasDimensions;

    this.timeRangeScale = d3Scale.scaleLinear()
      .domain([
        dateStringToTimestamp(scrobbleList[0].date),
        dateStringToTimestamp(scrobbleList[scrobbleList.length - 1].date),
      ])
      .range([timeAxisOffset, width - timeAxisOffset]);

    this.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([
        Math.min(...this.artistPlaycountList),
        Math.max(...this.artistPlaycountList),
      ])
      .range([height - timeAxisOffset, timeAxisOffset]);
  }

  putScrobbleIntoBuffer(x, y, scrobble) {
    if (!this.scrobbleBuffer[x]) {
      this.scrobbleBuffer[x] = {};
    }

    if (!this.scrobbleBuffer[x][y]) {
      this.scrobbleBuffer[x][y] = [];
    }

    this.scrobbleBuffer[x][y].push(scrobble);
  }

  getFirstScrobbleFromBuffer(x, y) {
    return this.scrobbleBuffer[x] && this.scrobbleBuffer[x][y] && this.scrobbleBuffer[x][y][0];
  }

  drawBackground() {
    const [width, height] = this.canvasDimensions;

    this.ctx.fillStyle = cssColors.darkBlue;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawScrobbleList() {
    const {scrobbleList} = this.props;

    this.ctx.fillStyle = cssColors.grey;

    scrobbleList
      // .slice(0, 100)
      .forEach(this.drawScrobble, this);
  }

  drawScrobble(scrobble) {
    const {date, artist} = scrobble;
    const {scrobbleSize} = this.props;
    const x = Math.round(this.timeRangeScale(dateStringToTimestamp(date)));
    const y = Math.round(this.artistPlaycountScale(artist.playcount));

    this.ctx.fillRect(x - this.scrobbleOffset, y - this.scrobbleOffset, scrobbleSize, scrobbleSize);
    this.putScrobbleIntoBuffer(x, y, scrobble);
  }

  drawScrobbleHighlight(x, y) {
    const {scrobbleSize} = this.props;

    this.ctx.fillStyle = cssColors.lightGrey1;
    this.ctx.fillRect(x - this.scrobbleOffset, y - this.scrobbleOffset, scrobbleSize, scrobbleSize);
  }

  drawTimeAxis() {
    const {timeAxisOffset} = this.props;
    const [width, height] = this.canvasDimensions;

    this.ctx.strokeStyle = cssColors.lightGrey1;
    this.ctx.beginPath();
    this.ctx.moveTo(timeAxisOffset, height - timeAxisOffset);
    this.ctx.lineTo(width - timeAxisOffset, height - timeAxisOffset);
    this.ctx.stroke();
  }

  // @todo: introduce scrobbleOffset-based tolerance
  handleCanvasMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.getFirstScrobbleFromBuffer(x, y);

    if (scrobble) {
      const {date, artist, album, track} = scrobble;

      this.drawScrobbleHighlight(x, y);
      this.dateElement.innerText = `date: ${date}`;
      this.artistNameElement.innerText = `artist: ${artist.name} (${artist.playcount})`;
      this.albumNameElement.innerText = `album: ${album.name} (${album.playcount})`;
      this.trackNameElement.innerText = `track: ${track.name} (${track.playcount})`;
    }
  }

  render() {
    requestAnimationFrame(() => {
      this.initializeElements();
      this.initializeScales();

      this.drawBackground();
      this.drawScrobbleList();
      this.drawTimeAxis();
    });

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
