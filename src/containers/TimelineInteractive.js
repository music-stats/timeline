import * as d3Scale from 'd3-scale';

import config from '../config';
import {clamp} from '../utils/number';
import {timestampToDateTimeString} from '../utils/date';

import Collection from '../stores/Collection';
import Registry from '../stores/Registry';

export default class TimelineInteractive {
  constructor(props, timeline) {
    this.props = props;
    this.timeline = timeline;

    this.selectedScrobble = null;
    this.pointCollectionHighlighted = new Collection();
    this.genrePointRegistry = new Registry(({scrobble: {artist: {genre}}}) => genre);
    this.artistPointRegistry = new Registry(({scrobble: {artist: {name}}}) => name);
    this.isPlotMouseDown = false;
    this.plotMouseX = null;

    Object.assign(
      this.timeline.props,
      {
        onScrobblePointCreate: this.handleScrobblePointCreate.bind(this),
        onPlotMouseDown: this.handlePlotMouseDown.bind(this),
        onPlotMouseUp: this.handlePlotMouseUpOrOut.bind(this),
        onPlotMouseOut: this.handlePlotMouseUpOrOut.bind(this),
        onPlotMouseMove: this.handlePlotMouseMove.bind(this),
        onPlotWheel: this.handlePlotWheel.bind(this),
        onLegendGenreMouseEnter: this.handleLegendGenreMouseEnter.bind(this),
      },
    );
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    document.addEventListener('keydown', this.handleDocumentKeydown.bind(this));
  }

  resetScales() {
    const {plot} = this.timeline.children;

    plot.scale();
    this.timeline.plotScales = this.timeline.getPlotScales();
  }

  resetState() {
    const {pointBuffer} = this.timeline;

    pointBuffer.reset();
    this.genrePointRegistry.reset();
    this.artistPointRegistry.reset();
    this.pointCollectionHighlighted.reset();
    this.selectedScrobble = null;
  }

  resetUi() {
    const {infoBox, selectedScrobbleTimeLabel, legend, artistLabelCollection} = this.timeline.children;

    infoBox.showIntroMessage();
    selectedScrobbleTimeLabel.clear();
    legend.removeGenreHighlight();
    artistLabelCollection.removeAllLabels();
  }

  highlightGenre(genre, artistNameToSkip = null, toRenderArtistLabelCollection = true) {
    const {plot, artistLabelCollection} = this.timeline.children;
    const [plotWidth] = plot.getDimensions();
    const artistLastPoints = {};

    this.genrePointRegistry.getItemList(genre).forEach(({
      x,
      y,
      highlightedGenreColor: color,
      scrobble: {artist: {name: artistName}},
    }) => {
      if (artistName !== artistNameToSkip) {
        this.pointCollectionHighlighted.push({x, y});
        artistLastPoints[artistName] = {x, y, color};
        plot.drawPoint(x, y, color);
      }
    });

    if (toRenderArtistLabelCollection) {
      // points are sorted by Y coord (i.e. artist total playcount),
      // so labels are also sorted and are getting placed closer to their points
      Object.entries(artistLastPoints)
        .map(([artistName, point]) => ({text: artistName, ...point}))
        .sort((a, b) => b.y - a.y)
        .forEach((point) => artistLabelCollection.renderLabel(point, plotWidth, false));
    }
  }

  highlightArtist({index, artist, track}, toRenderArtistLabelCollection = true) {
    const {timeline: {point: {selectedColor: selectedTrackColor}}} = config;
    const {plot, selectedScrobbleTimeLabel, artistLabelCollection} = this.timeline.children;
    const [plotWidth] = plot.getDimensions();
    const sameTrackPointList = [];
    let lastPoint = null;

    this.artistPointRegistry.getItemList(artist.name).forEach(({
      x,
      y,
      highlightedArtistColor: color,
      scrobble: {
        index: scrobbleGlobalIndex,
        timestamp,
        track: {name},
      },
    }) => {
      this.pointCollectionHighlighted.push({x, y});
      lastPoint = {x, y, color};

      // skipping same track scrobbles, those will be rendered after the main loop (to appear on top)
      if (name === track.name) {
        sameTrackPointList.push({x, y});
      } else {
        plot.drawPoint(x, y, color);
      }

      if (scrobbleGlobalIndex === index) {
        selectedScrobbleTimeLabel.renderText(x, timestampToDateTimeString(timestamp), plotWidth);
      }
    });

    sameTrackPointList.forEach(({x, y}) => plot.drawPoint(x, y, selectedTrackColor));

    if (toRenderArtistLabelCollection) {
      artistLabelCollection.renderLabel({text: artist.name, ...lastPoint}, plotWidth, true);
    }
  }

  removePointsHighlight() {
    const {pointBuffer} = this.timeline;
    const {plot} = this.timeline.children;

    this.pointCollectionHighlighted.getAll().forEach(
      ({x, y}) => plot.drawPoint(x, y, pointBuffer.getPoint(x, y).color),
    );
    this.pointCollectionHighlighted.reset();
  }

  selectGenre(genre) {
    const {legend} = this.timeline.children;

    // clean old
    this.selectedScrobble = null;
    this.removePointsHighlight();
    this.resetUi();

    // show new
    this.highlightGenre(genre);
    legend.highlightGenre(genre);
  }

  selectScrobble(scrobble) {
    const {scrobbleListSummary} = this.timeline;
    const {infoBox, legend, artistLabelCollection} = this.timeline.children;
    const {artist} = scrobble;
    const isNewArtist = !(this.selectedScrobble && this.selectedScrobble.artist.name === artist.name);

    this.selectedScrobble = scrobble;

    // clean old
    this.removePointsHighlight();
    infoBox.hideIntroMessage();

    // there's no need to re-render genre-related labels if selected artist didn't change
    if (isNewArtist) {
      legend.removeGenreHighlight();
      artistLabelCollection.removeAllLabels();
    }

    // show new
    if (artist.genre) {
      this.highlightGenre(artist.genre, artist.name, isNewArtist);

      if (isNewArtist) {
        legend.highlightGenre(artist.genre);
      }
    }

    // artist scrobbles are rendered on top of genre scrobbles and artist labels
    this.highlightArtist(scrobble, isNewArtist);

    infoBox.renderScrobbleInfo({
      scrobble,
      totals: scrobbleListSummary.getTotals(scrobble),
    });
  }

  selectVerticallyAdjacentScrobble(shift) {
    const {scrobbleCollectionZoomed} = this.timeline;

    if (this.selectedScrobble) {
      const adjacentScrobble = scrobbleCollectionZoomed.getAdjacent(this.selectedScrobble, shift);

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  selectHorizontallyAdjacentScrobble(shift) {
    const {scrobbleCollectionZoomed} = this.timeline;

    if (this.selectedScrobble) {
      const filter = ({artist: {playcount}}) => playcount === this.selectedScrobble.artist.playcount;
      const adjacentScrobble = scrobbleCollectionZoomed.getAdjacent(this.selectedScrobble, shift, filter);

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  selectScrobbleUnderMouse(event) {
    const {pointBuffer} = this.timeline;
    const {offsetX: x, offsetY: y} = event;
    const point = pointBuffer.getPointWithTolerance(x, y);

    if (point && point.scrobble !== this.selectedScrobble) {
      this.selectScrobble(point.scrobble);
    }
  }

  panPlot(event) {
    const {scrobbleCollectionFull, plotScales: {x: timeRangeScale}} = this.timeline;
    const {offsetX: x} = event;
    const minTimestamp = scrobbleCollectionFull.getFirst().timestamp;
    const maxTimestamp = scrobbleCollectionFull.getLast().timestamp;

    const [leftTimestamp, rightTimestamp] = timeRangeScale.domain();

    if (rightTimestamp - leftTimestamp >= maxTimestamp - minTimestamp) {
      return;
    }

    let timestampDiff = timeRangeScale.invert(this.plotMouseX) - timeRangeScale.invert(x);

    if (!timestampDiff) {
      return;
    }

    if (rightTimestamp + timestampDiff > maxTimestamp) {
      timestampDiff = maxTimestamp - rightTimestamp;
    } else if (leftTimestamp + timestampDiff < minTimestamp) {
      timestampDiff = minTimestamp - leftTimestamp;
    }

    if (timestampDiff) {
      this.updatePlotTimeRange(
        leftTimestamp + timestampDiff,
        rightTimestamp + timestampDiff,
      );
    }
  }

  zoomPlot(event) {
    const {timeline: {zoomDeltaFactor, minTimeRange, plot: {padding: plotPadding}}} = config;
    const {scrobbleCollectionFull, plotScales: {x: timeRangeScale}} = this.timeline;
    const {plot} = this.timeline.children;
    const {offsetX, deltaY} = event;
    const timeRangeZoomed = timeRangeScale.domain();

    const [plotWidth] = plot.getDimensions();
    const plotWidthPadded = plotWidth - 2 * plotPadding;

    const timeScale = d3Scale.scaleLinear()
      .domain([0, plotWidthPadded])
      .rangeRound(timeRangeZoomed);

    const xTimestamp = timeScale(clamp(offsetX - plotPadding, ...timeScale.domain()));
    const zoomFactor = 1 - deltaY * zoomDeltaFactor;
    const leftTimeDiff = (xTimestamp - timeRangeZoomed[0]) / zoomFactor;
    const rightTimeDiff = (timeRangeZoomed[1] - xTimestamp) / zoomFactor;

    if (leftTimeDiff + rightTimeDiff >= minTimeRange) {
      this.updatePlotTimeRange(
        Math.max(
          xTimestamp - leftTimeDiff,
          scrobbleCollectionFull.getFirst().timestamp,
        ),
        Math.min(
          xTimestamp + rightTimeDiff,
          scrobbleCollectionFull.getLast().timestamp,
        ),
      );
    }
  }

  updatePlotTimeRange(leftTimestamp, rightTimestamp) {
    const {scrobbleList} = this.props;
    const {scrobbleCollectionFull, plotScales: {x: timeRangeScale}} = this.timeline;
    const leftScrobble = scrobbleCollectionFull.findFirst(({timestamp}) => timestamp >= leftTimestamp);
    const rightScrobble = scrobbleCollectionFull.findLast(({timestamp}) => timestamp <= rightTimestamp);

    timeRangeScale.domain([
      leftTimestamp,
      rightTimestamp,
    ]);

    this.timeline.scrobbleCollectionZoomed = new Collection(scrobbleList.slice(
      leftScrobble.index,
      rightScrobble.index + 1,
    ));

    this.resetState();
    this.draw();
    this.resetUi();
  }

  handleScrobblePointCreate(point) {
    this.genrePointRegistry.putItem(point);
    this.artistPointRegistry.putItem(point);
  }

  handleWindowResize() {
    // A timeout handle is used for throttling and dealing with mobile device rotation.
    // On some mobile browsers, the "resize" event is triggered before window dimensions are changed.
    clearTimeout(this.windowResizeTimeoutHandle);

    this.windowResizeTimeoutHandle = setTimeout(
      () => {
        this.resetScales();
        this.resetState();
        this.draw();
        this.resetUi();
      },
      100,
    );
  }

  handleDocumentKeydown(event) {
    switch (event.key) {
      case 'Escape': return this.handleEscKeydown();
      case 'ArrowDown': return this.selectVerticallyAdjacentScrobble(-1);
      case 'ArrowUp': return this.selectVerticallyAdjacentScrobble(1);
      case 'ArrowLeft': return this.selectHorizontallyAdjacentScrobble(-1);
      case 'ArrowRight': return this.selectHorizontallyAdjacentScrobble(1);
    }
  }

  handleEscKeydown() {
    this.selectedScrobble = null;
    this.removePointsHighlight();
    this.resetUi();
  }

  handlePlotMouseDown(event) {
    const {button} = event;

    // main button (usually the left button)
    if (button === 0) {
      this.isPlotMouseDown = true;
    }
  }

  handlePlotMouseUpOrOut() {
    this.isPlotMouseDown = false;
  }

  handlePlotMouseMove(event) {
    const {offsetX} = event;

    if (this.isPlotMouseDown) {
      this.panPlot(event);
    } else {
      this.selectScrobbleUnderMouse(event);
    }

    this.plotMouseX = offsetX;
  }

  handlePlotWheel(event) {
    event.preventDefault();
    this.zoomPlot(event);
  }

  handleLegendGenreMouseEnter(genre) {
    this.selectGenre(genre);
  }

  draw() {
    this.timeline.draw();
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
