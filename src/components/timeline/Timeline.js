import * as d3Scale from 'd3-scale';
import html from '../../lib/html';

import cssColors from '../../app-theme';
import {dateStringToTimestamp} from '../../utils/date';

import './Timeline.css';

export default class Timeline {
  static getDefaultProps() {
    return {
      infoBoxHeight: 160,
      plotPadding: 20,
      scrobbleSize: 4,
      scrobbleMargin: 2,
      timeAxisWidth: 2,
      colors: {
        background: cssColors.darkBlue,
        scrobble: cssColors.darkGrey2,
        artistHighlight: cssColors.grey1,
        scrobbleHighlight: cssColors.lightGrey2,
        timeAxis: cssColors.grey1,
      },
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

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.scrobbleBuffer = {};
    this.scrobbleHighlightPointList = [];
    this.scrobbleArtistIndex = {};

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

  plotScrobbleOnBuffer(x, y, scrobble) {
    if (!this.scrobbleBuffer[x]) {
      this.scrobbleBuffer[x] = {};
    }

    this.scrobbleBuffer[x][y] = scrobble;
  }

  getPlottedScrobbleFromBuffer(x, y) {
    const xFrom = x - this.scrobbleHalfSize;
    const xTo = x + this.scrobbleHalfSize;
    const yFrom = y - this.scrobbleHalfSize;
    const yTo = y + this.scrobbleHalfSize;
    let scrobble = null;

    for (let xi = xFrom; xi <= xTo; xi += 1) {
      for (let yj = yFrom; yj <= yTo; yj += 1) {
        scrobble = this.scrobbleBuffer[xi] && this.scrobbleBuffer[xi][yj];

        if (scrobble) {
          return {
            ...scrobble,
            x: xi,
            y: yj,
          };
        }
      }
    }

    return null;
  }

  putScrobbleIntoArtistIndex(x, y, scrobble) {
    const {artist: {name}} = scrobble;

    if (!this.scrobbleArtistIndex[name]) {
      this.scrobbleArtistIndex[name] = [];
    }

    this.scrobbleArtistIndex[name].push({
      ...scrobble,
      x,
      y,
    });
  }

  getScrobblesForArtist(artistName) {
    return this.scrobbleArtistIndex[artistName];
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

    scrobbleList
      // .slice(0, 100)
      .forEach(this.drawScrobble, this);
  }

  drawScrobble(scrobble) {
    const {date, artist} = scrobble;
    const x = this.timeRangeScale(dateStringToTimestamp(date));
    const y = this.artistPlaycountScale(artist.playcount);

    this.drawScrobblePoint(x, y);
    this.plotScrobbleOnBuffer(x, y, scrobble);
    this.putScrobbleIntoArtistIndex(x, y, scrobble);
  }

  drawScrobbleHighlight(x, y, scrobble) {
    const {colors} = this.props;

    // redraw previously highlighted scrobbles
    if (this.scrobbleHighlightPointList.length) {
      this.ctx.fillStyle = colors.scrobble;

      for (let i = 0; i < this.scrobbleHighlightPointList.length - 1; i += 2) {
        this.drawScrobblePoint(
          this.scrobbleHighlightPointList[i],
          this.scrobbleHighlightPointList[i + 1],
        );
      }
    }

    this.scrobbleHighlightPointList = [];

    this.getScrobblesForArtist(scrobble.artist.name).forEach(({track, x: xi, y: yi}) => {
      this.ctx.fillStyle = track.name === scrobble.track.name
        ? colors.scrobbleHighlight
        : colors.artistHighlight;
      this.drawScrobblePoint(xi, yi);
      this.scrobbleHighlightPointList.push(xi, yi);
    });
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

  handleCanvasMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.getPlottedScrobbleFromBuffer(x, y);

    if (scrobble) {
      const {date, artist, album, track, x: xBuffer, y: yBuffer} = scrobble;

      this.drawScrobbleHighlight(xBuffer, yBuffer, scrobble);

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
