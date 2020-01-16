import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';
import html from '../lib/html';

import config from '../config';

import Collection from '../stores/Collection';
import PointBuffer from '../stores/PointBuffer';
import ScrobbleListSummary from '../stores/ScrobbleListSummary';

import Plot from '../components/Plot';
import PlotInteractive from '../components/PlotInteractive';
import TimeAxisLabel from '../components/TimeAxisLabel';
import InfoBox from '../components/InfoBox';
import ExternalLinks from '../components/ExternalLinks';
import Legend from '../components/Legend';
import LegendInteractive from '../components/LegendInteractive';
import ArtistLabelCollection from '../components/ArtistLabelCollection';

export default class Timeline {
  constructor(props) {
    const {timeline: {point: {size: scrobbleSize}}} = config;
    const {scrobbleList} = props;

    this.props = props;
    this.children = {};

    this.scrobbleHalfSize = Math.ceil(scrobbleSize / 2);

    this.scrobbleCollectionFull = new Collection(scrobbleList);
    this.scrobbleCollectionZoomed = new Collection(scrobbleList);
    this.pointBuffer = new PointBuffer(this.scrobbleHalfSize);
    this.scrobbleListSummary = new ScrobbleListSummary(scrobbleList);

    this.plotScales = {}; // to be initialized after render, since it relies on plot dimensions
    this.unknownGenreColorScale = this.getUnknownGenreColorScale();
    this.genreGroupColorScales = this.getGenreGroupColorScales();
  }

  initializeChildrenComponents() {
    const {
      scrobbleList,
      onPlotMouseDown,
      onPlotMouseUp,
      onPlotMouseOut,
      onPlotMouseMove,
      onPlotWheel,
      onLegendGenreClick,
    } = this.props;

    this.children.plot = new PlotInteractive(
      {
        onMouseDown: onPlotMouseDown,
        onMouseUp: onPlotMouseUp,
        onMouseOut: onPlotMouseOut,
        onMouseMove: onPlotMouseMove,
        onWheel: onPlotWheel,
      },
      new Plot({
        pointHalfSize: this.scrobbleHalfSize,
      }),
    );

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: this.scrobbleCollectionFull.getFirst().date,
        lastScrobbleDate: this.scrobbleCollectionFull.getLast().date,
      },
      counts: {
        ...this.scrobbleListSummary.getCounts(),
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

    this.children.legend = new LegendInteractive(
      {
        onGenreClick: onLegendGenreClick,
      },
      new Legend({
        scrobbleList,
      }),
    );

    this.children.artistLabelCollection = new ArtistLabelCollection();
  }

  getPerDayCount() {
    const {scrobbleList} = this.props;
    const firstScrobbleTimestamp = this.scrobbleCollectionFull.getFirst().timestamp;
    const lastScrobbleTimestamp = this.scrobbleCollectionFull.getLast().timestamp;
    const msInDay = 24 * 60 * 60 * 1000;
    const dayCount = Math.ceil((lastScrobbleTimestamp - firstScrobbleTimestamp) / msInDay);
    const perDayCount = Math.round(10 * scrobbleList.length / dayCount) / 10;

    return perDayCount;
  }

  getPlotScales() {
    const {
      timeline: {
        plot: {padding: plotPadding},
        point: {size: scrobbleSize, maxMargin: scrobbleMaxMargin},
        timeAxis: {width: timeAxisWidth},
      },
    } = config;

    const {plot} = this.children;
    const [width, height] = plot.getDimensions();
    const maxArtistPlaycount = this.scrobbleListSummary.getMaxArtistPlaycount();

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

    const timeRangeScale = d3Scale.scaleLinear()
      .domain([
        this.scrobbleCollectionZoomed.getFirst().timestamp,
        this.scrobbleCollectionZoomed.getLast().timestamp,
      ])
      .rangeRound([plotPadding, width - plotPadding]);

    const artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    return {
      x: timeRangeScale,
      y: artistPlaycountScale,
    };
  }

  getUnknownGenreColorScale() {
    const {timeline: {unknownGenreColorRange}} = config;

    return d3Scale.scaleSequential()
      .domain([1, this.scrobbleListSummary.getMaxAlbumPlaycount()])
      .range(unknownGenreColorRange);
  }

  getGenreGroupColorScales() {
    const {genreGroups} = config;
    const scales = {};

    for (const genreGroup in genreGroups) {
      scales[genreGroup] = d3Scale.scaleSequential()
        .domain([1, this.scrobbleListSummary.getMaxAlbumPlaycount()])
        .range(genreGroups[genreGroup].colorRange);
    }

    return scales;
  }

  getGenreGroupColorByAlbumPlaycount(genreGroup, playcount, toHighlightGenre = false, toHighlightArtist = false) {
    const {timeline: {point: {colorValueFactors}}} = config;
    const colorScale = this.genreGroupColorScales[genreGroup] || this.unknownGenreColorScale;
    const color = d3Color.hsl(colorScale(playcount));

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

  draw() {
    const {onScrobblePointCreate} = this.props;
    const {plot, firstScrobbleTimeLabel, lastScrobbleTimeLabel} = this.children;
    const [plotWidth] = plot.getDimensions();
    const firstScrobble = this.scrobbleCollectionZoomed.getFirst();
    const lastScrobble = this.scrobbleCollectionZoomed.getLast();

    plot.drawBackground();

    this.scrobbleCollectionZoomed.getAll().forEach((scrobble) => {
      const {timestamp, artist, album} = scrobble;
      const x = this.plotScales.x(timestamp);
      const y = this.plotScales.y(artist.playcount);
      const color = this.getGenreGroupColorByAlbumPlaycount(artist.genreGroup, album.playcount);
      const point = {
        x,
        y,
        color,
        scrobble,
      };

      // checking for a point presence in the buffer
      // in order not to re-render multiple points with same coords
      if (!this.pointBuffer.getPoint(x, y)) {
        plot.drawPoint(x, y, color);
        this.pointBuffer.putPoint(point);
      }

      onScrobblePointCreate(point);
    });

    plot.drawTimeAxis(...this.plotScales.x.range());

    firstScrobbleTimeLabel.renderText(this.plotScales.x(firstScrobble.timestamp), plotWidth, firstScrobble.date);
    lastScrobbleTimeLabel.renderText(this.plotScales.x(lastScrobble.timestamp), plotWidth, lastScrobble.date);
  }

  // things needed for the first render
  beforeRender() {
    this.initializeChildrenComponents();
  }

  // things to initialize after the first render
  afterRender() {
    const {plot} = this.children;

    Object.values(this.children).forEach((child) => {
      if (typeof child.afterRender === 'function') {
        child.afterRender();
      }
    });

    plot.scale();
    this.plotScales = this.getPlotScales();
  }

  render() {
    return html`
      <main>
        ${Object.values(this.children).map((child) => child.render())}
      </main>
    `;
  }
}
