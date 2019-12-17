import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import html from '../lib/html';

import cssColors from '../app-theme';
import {dateTimeStringToTimestamp, dataTimeStringToDateString} from '../utils/date';

import PlotBuffer from '../stores/PlotBuffer';
import ArtistRegistry from '../stores/ArtistRegistry';

import Plot from '../components/Plot';
import TimeAxisLabel from '../components/TimeAxisLabel';
import InfoBox from '../components/InfoBox';

// @todo:
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

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);
    this.scrobbleTotalRegistry = null;
    this.scrobbleSummary = null;
    this.scrobbleHighlightPointList = []; // [x1, y1, x2, y2, ...]
    this.highlightedScrobble = null;
    this.toShowIntroMessage = true;

    this.scales = {};
    this.plotBuffer = new PlotBuffer(this.scrobbleHalfSize);
    this.artistRegistry = new ArtistRegistry();

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handlePlotMouseMove = this.handlePlotMouseMove.bind(this);
  }

  reset() {
    this.plotBuffer.reset();
    this.artistRegistry.reset();

    this.scrobbleHighlightPointList = [];
    this.highlightedScrobble = null;
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  initializeChildrenComponents() {
    const {scrobbleList, scrobbleSize, plotPadding, timeAxisWidth, colors} = this.props;
    const [dayCount, perDayCount] = this.getPeriodCounts();

    this.children.plot = new Plot({
      pointSize: scrobbleSize,
      pointHalfSize: this.scrobbleHalfSize,
      padding: plotPadding,
      timeAxisWidth,
      colors: {
        background: colors.background,
        timeAxis: colors.timeAxis,
      },
      onMouseMove: this.handlePlotMouseMove,
    });

    this.children.timeAxisLabel = new TimeAxisLabel();

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: dataTimeStringToDateString(scrobbleList[0].date),
        lastScrobbleDate: dataTimeStringToDateString(scrobbleList[scrobbleList.length - 1].date),
      },
      counts: {
        ...this.scrobbleSummary,
        scrobbleCount: scrobbleList.length,
        dayCount,
        perDayCount,
      },
    });
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
    const {plot} = this.children;
    const [width, height] = plot.getDimensions();

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
    this.scales.timeRangeScale = d3Scale.scaleLinear()
      .domain([minDateTimestamp, maxDateTimestamp])
      .rangeRound([plotLeft, plotRight]);

    // Y axis
    this.scales.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    // scrobble point color
    this.scales.albumPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxAlbumPlaycount])
      .range([colorRanges.albumPlaycount.from, colorRanges.albumPlaycount.to]);
  }

  getColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateGreys(this.scales.albumPlaycountScale(playcount));
  }

  getHighlightColorByAlbumPlaycount(playcount) {
    return d3ScaleChromatic.interpolateWarm(this.scales.albumPlaycountScale(playcount));
  }

  highlightArtistScrobbleList(scrobble) {
    const {plotPadding, scrobbleMargin, colors} = this.props;
    const {plot, timeAxisLabel} = this.children;
    const {index: highlightedScrobbleGlobalIndex, artist, track} = scrobble;

    this.artistRegistry.getArtistScrobbleList(artist.name).forEach((
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

      plot.drawPoint(xi, yi, color);
      this.scrobbleHighlightPointList.push(xi, yi);

      if (artistScrobbleLocalIndex === 0) {
        timeAxisLabel.renderText(xi, plot.getDimensions()[0], scrobbleMargin, plotPadding, date);
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

    const {plot} = this.children;

    for (let i = 0; i < this.scrobbleHighlightPointList.length - 1; i += 2) {
      const x = this.scrobbleHighlightPointList[i];
      const y = this.scrobbleHighlightPointList[i + 1];
      const {color} = this.plotBuffer.getPoint(x, y);

      plot.drawPoint(x, y, color);
    }

    this.scrobbleHighlightPointList = [];
  }

  selectScrobble(scrobble) {
    const {infoBox} = this.children;

    if (this.toShowIntroMessage) {
      this.hideIntroMessage();
    }

    this.removeScrobbleHighlight();
    this.highlightArtistScrobbleList(scrobble);

    infoBox.renderScrobbleInfo({
      scrobble,
      totals: this.getScrobbleTotals(scrobble),
    });
  }

  selectVerticallyAdjacentScrobble(scrobble, shift) {
    if (!scrobble) {
      return;
    }

    const {scrobbleList} = this.props;
    let {index} = scrobble;
    const stepCondition = shift > 0
      ? () => index < scrobbleList.length - 1
      : () => index > 0;

    if (stepCondition()) {
      index += shift;

      this.selectScrobble({
        ...scrobbleList[index],
        index,
      });
    }
  }

  selectHorizontallyAdjacentScrobble(scrobble, shift) {
    if (!scrobble) {
      return;
    }

    const {scrobbleList} = this.props;
    const {artist: {playcount}} = scrobble;
    let {index} = scrobble;
    const stepCondition = shift > 0
      ? () => index < scrobbleList.length - 1
      : () => index > 0;
    const finishCondition = () => scrobbleList[index].artist.playcount === playcount;

    while (stepCondition()) {
      index += shift;

      if (finishCondition()) {
        this.selectScrobble({
          ...scrobbleList[index],
          index,
        });

        return;
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

  handlePlotMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.plotBuffer.getPoint(x, y);

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

      plot.drawPoint(x, y, color);
      this.plotBuffer.putPoint(x, y, scrobble, index, color);
      this.artistRegistry.putScrobble(x, y, scrobble, index);
    });

    plot.drawTimeAxis(...this.scales.timeRangeScale.range());
  }

  // things needed for the first render
  beforeRender() {
    this.initializeTotals();
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
