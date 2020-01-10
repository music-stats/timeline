import * as d3Scale from 'd3-scale';

import config from '../config';
import {clamp} from '../utils/number';
import PointCollection from '../stores/PointCollection';

export default class TimelineInteractive {
  constructor(props, timeline) {
    this.props = props;
    this.timeline = timeline;

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
    this.handlePlotMouseMove = this.handlePlotMouseMove.bind(this);
    this.handlePlotWheel = this.handlePlotWheel.bind(this);
    this.handleLegendGenreClick = this.handleLegendGenreClick.bind(this);

    Object.assign(
      this.timeline.props,
      {
        onPlotMouseMove: this.handlePlotMouseMove,
        onPlotWheel: this.handlePlotWheel,
        onLegendGenreClick: this.handleLegendGenreClick,
      },
    );
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  handleWindowResize() {
    // A timeout handle is used for throttling and dealing with mobile device rotation.
    // On some mobile browsers, the "resize" event is triggered before window dimensions are changed.
    clearTimeout(this.windowResizeTimeoutHandle);

    this.windowResizeTimeoutHandle = setTimeout(
      () => {
        this.timeline.resetState();
        this.timeline.draw();
        this.timeline.resetUi();
      },
      100,
    );
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
    this.timeline.selectedScrobble = null;
    this.timeline.removeScrobbleCollectionHighlight();
    this.timeline.resetUi();
  }

  handleArrowDownKeydown() {
    this.timeline.selectVerticallyAdjacentScrobble(this.timeline.selectedScrobble, -1);
  }

  handleArrowUpKeydown() {
    this.timeline.selectVerticallyAdjacentScrobble(this.timeline.selectedScrobble, 1);
  }

  handleArrowLeftKeydown() {
    this.timeline.selectHorizontallyAdjacentScrobble(this.timeline.selectedScrobble, -1);
  }

  handleArrowRightKeydown() {
    this.timeline.selectHorizontallyAdjacentScrobble(this.timeline.selectedScrobble, 1);
  }

  handlePlotMouseMove(event) {
    const {offsetX: x, offsetY: y} = event;
    const scrobble = this.timeline.scrobbleBuffer.getPoint(x, y);

    if (scrobble) {
      this.timeline.selectScrobble(scrobble);
    }
  }

  handlePlotWheel(event) {
    event.preventDefault();

    const {timeline: {zoomDeltaFactor, minTimeRange, plot: {padding: plotPadding}}} = config;
    const {scrobbleList} = this.props;
    const {plot} = this.timeline.children;
    const {offsetX, deltaY} = event;

    const [plotWidth] = plot.getDimensions();
    const plotWidthPadded = plotWidth - 2 * plotPadding;

    const timeScale = d3Scale.scaleLinear()
      .domain([0, plotWidthPadded])
      .rangeRound(this.timeline.timeRangeZoomed);

    const xTimestamp = timeScale(clamp(offsetX - plotPadding, ...timeScale.domain()));
    const zoomFactor = 1 - deltaY * zoomDeltaFactor;
    const leftTimeRange = (xTimestamp - this.timeline.timeRangeZoomed[0]) / zoomFactor;
    const rightTimeRange = (this.timeline.timeRangeZoomed[1] - xTimestamp) / zoomFactor;

    if (leftTimeRange + rightTimeRange < minTimeRange) {
      return;
    }

    this.timeline.timeRangeZoomed = [
      Math.max(xTimestamp - leftTimeRange, this.timeline.timeRange[0]),
      Math.min(xTimestamp + rightTimeRange, this.timeline.timeRange[1]),
    ];

    this.timeline.scrobbleCollectionZoomed = new PointCollection(scrobbleList.slice(
      this.timeline.scrobbleCollection.getPrevious(this.timeline.timeRangeZoomed[0]).index,
      this.timeline.scrobbleCollection.getNext(this.timeline.timeRangeZoomed[1]).index + 1,
    ));

    this.timeline.resetState();
    this.timeline.draw(false);
    this.timeline.resetUi();
  }

  handleLegendGenreClick(genre, genreGroup) {
    this.timeline.selectGenre(genre, genreGroup);
  }

  draw(toRescalePlot = true) {
    this.timeline.draw(toRescalePlot);
  }

  beforeRender() {
    this.timeline.beforeRender();
  }

  afterRender() {
    this.timeline.afterRender();
    this.subscribe();
  }

  render() {
    return this.timeline.render();
  }
}
