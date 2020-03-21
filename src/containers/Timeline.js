import * as d3Scale from 'd3-scale';
import html from '../lib/html';

import config from '../config';

import Collection from '../stores/Collection';
import PointBuffer from '../stores/PointBuffer';

import Plot from '../components/Plot';
import PlotInteractive from '../components/PlotInteractive';
import TimeAxisLabel from '../components/TimeAxisLabel';
import YearNavigation from '../components/YearNavigation';
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

    this.scrobbleCollection = new Collection(scrobbleList);
    this.pointBuffer = new PointBuffer(this.scrobbleHalfSize);

    // to be initialized after render, since it relies on plot dimensions
    this.plotScales = {};
  }

  initializeChildrenComponents() {
    const {timeline: {timeAxis: {tickLabelCount}}} = config;
    const {
      summary,
      yearList,
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

    this.children.yearNavigation = new YearNavigation({
      currentYear: document.location.hash.slice(1),
      yearList,
    });

    this.children.infoBox = new InfoBox({
      dates: {
        firstScrobbleDate: this.scrobbleCollection.getFirst().date,
        lastScrobbleDate: this.scrobbleCollection.getLast().date,
      },
      summary,
    });

    this.children.externalLinks = new ExternalLinks();

    this.children.selectedScrobbleTimeLabel = new TimeAxisLabel({
      id: 'selected-scrobble-time-label',
      isMostTop: true,
    });

    for (let index = 0; index < tickLabelCount; index += 1) {
      this.children[`timeTickLabel${index}`] = new TimeAxisLabel({
        id: `time-tick-label--${index}`,
      });
    }

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
        labels: {areaPadding: labelAreaPadding, highlightedHeight: highlightedLabelHeight},
      },
    } = config;

    const {summary} = this.props;
    const {plot} = this.children;
    const [width, height] = plot.getDimensions();

    // plot height calculation is ensuring equal vertical gaps between points
    const plotBottom = height - plotPadding - timeAxisWidth / 2 - scrobbleSize;
    const plotMaxHeight = plotBottom - labelAreaPadding - highlightedLabelHeight - scrobbleSize;
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
    const plotLeft = plotPadding;
    const plotRight = width - plotPadding;

    const fullTimeRangeScale = d3Scale.scaleTime()
      .domain([
        this.scrobbleCollection.getFirst().timestamp,
        this.scrobbleCollection.getLast().timestamp,
      ])
      .rangeRound([plotLeft, plotRight]);

    const timeRangeScale = d3Scale.scaleTime()
      .domain([
        this.scrobbleCollection.getFirstVisible().timestamp,
        this.scrobbleCollection.getLastVisible().timestamp,
      ])
      .rangeRound([plotLeft, plotRight]);

    const artistPlaycountScale = d3Scale.scaleLinear()
      .domain([1, summary.maxArtistPlaycount])
      .rangeRound([plotBottom, plotTop]);

    return {
      timeAxis: fullTimeRangeScale,
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
    const {timeline: {timeAxis: {tickLabelCount}}} = config;
    const {onScrobblePointCreate} = this.props;
    const {timeAxis: fullTimeRangeScale, x: timeRangeScale} = this.plotScales;
    const {plot} = this.children;
    const plotWidth = plot.getDimensions()[0];

    const [leftDate, rightDate] = timeRangeScale.domain();
    const [leftX, rightX] = timeRangeScale.range();
    const leftTimeX = fullTimeRangeScale(leftDate);
    const rightTimeX = fullTimeRangeScale(rightDate);

    const tickList = timeRangeScale.ticks(plotWidth > 600 ? 12 : 4);
    const tickFormat = timeRangeScale.tickFormat();

    plot.drawBackground();

    this.scrobbleCollection.forEachVisible((scrobble) => {
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

    plot.drawTimeAxis(leftX, rightX, leftTimeX, rightTimeX);

    tickList.forEach((tick, index) => {
      this.children[`timeTickLabel${index}`].renderText(timeRangeScale(tick), tickFormat(tick), plotWidth);
    });

    for (let index = tickList.length; index < tickLabelCount; index += 1) {
      this.children[`timeTickLabel${index}`].clear();
    }
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
