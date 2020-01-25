import * as d3Scale from 'd3-scale';
import html from '../lib/html';

import config from '../config';
import {timestampToDateTimeString} from '../utils/date';

import Collection from '../stores/Collection';
import PointBuffer from '../stores/PointBuffer';

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

    // to be initialized after render, since it relies on plot dimensions
    this.plotScales = {};
  }

  initializeChildrenComponents() {
    const {
      summary,
      scrobbleList,
      onPlotMouseDown,
      onPlotMouseUp,
      onPlotMouseOut,
      onPlotMouseMove,
      onPlotWheel,
      onLegendGenreMouseEnter,
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
      summary,
    });

    this.children.externalLinks = new ExternalLinks();

    this.children.leftTimeLabel = new TimeAxisLabel({
      id: 'first-scrobble-time-label',
    });
    this.children.rightTimeLabel = new TimeAxisLabel({
      id: 'last-scrobble-time-label',
    });
    this.children.selectedScrobbleTimeLabel = new TimeAxisLabel({
      id: 'selected-scrobble-time-label',
      isMostTop: true,
    });

    this.children.legend = new LegendInteractive(
      {
        onGenreMouseEnter: onLegendGenreMouseEnter,
      },
      new Legend({
        scrobbleList,
      }),
    );

    this.children.artistLabelCollection = new ArtistLabelCollection();
  }

  getPlotScales() {
    const {
      timeline: {
        plot: {padding: plotPadding},
        point: {size: scrobbleSize, maxMargin: scrobbleMaxMargin},
        timeAxis: {width: timeAxisWidth},
      },
    } = config;

    const {summary} = this.props;
    const {plot} = this.children;
    const [width, height] = plot.getDimensions();

    // plot height calculation is ensuring equal vertical gaps between points
    const plotBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const plotMaxHeight = plotBottom - plotPadding;
    let scrobbleMargin = scrobbleMaxMargin;
    let plotHeight = plotMaxHeight;
    while (scrobbleMargin >= 0) {
      const plotHeightNext = (summary.maxArtistPlaycount - 1) * (scrobbleSize + scrobbleMargin);

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
      .domain([1, summary.maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    return {
      x: timeRangeScale,
      y: artistPlaycountScale,
    };
  }

  createScrobblePoint(scrobble) {
    const {timestamp, artist} = scrobble;

    return {
      x: this.plotScales.x(timestamp),
      y: this.plotScales.y(artist.playcount),
      scrobble,
    };
  }

  draw() {
    const {onScrobblePointCreate} = this.props;
    const {plot, leftTimeLabel, rightTimeLabel} = this.children;
    const [plotWidth] = plot.getDimensions();
    const [leftTimestamp, rightTimestamp] = this.plotScales.x.domain();
    const [leftX, rightX] = this.plotScales.x.range();

    plot.drawBackground();

    this.scrobbleCollectionZoomed.getAll().forEach((scrobble) => {
      const point = this.createScrobblePoint(scrobble);

      // Points with same coords are getting overridden in the buffer and drawn outside of this loop.
      // This allows to avoid flickering during zooming, because newer points always win.
      this.pointBuffer.putPoint(point);

      // However, the "onScrobblePointCreate()" callback is called on every point,
      // regardless if it remains in the buffer.
      // This allows to store them elsewhere for accessing on user interaction
      // (e.g. highlighting all points with a given artist).
      onScrobblePointCreate(point);
    });

    this.pointBuffer.forEachPoint((x, y, {scrobble: {color}}) => plot.drawPoint(x, y, color));

    plot.drawTimeAxis(leftX, rightX);

    leftTimeLabel.renderText(leftX, timestampToDateTimeString(leftTimestamp), plotWidth);
    rightTimeLabel.renderText(rightX, timestampToDateTimeString(rightTimestamp), plotWidth);
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
