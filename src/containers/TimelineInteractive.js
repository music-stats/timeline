import * as d3Scale from 'd3-scale';

import config from '../config';
import {createProxyMethod} from '../utils/decorator';
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

    [
      'draw',
      'beforeRender',
      'render',
    ].forEach(createProxyMethod(this, this.timeline));

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
  }

  subscribe() {
    window.addEventListener('resize', this.handleWindowResize);
    document.addEventListener('keydown', this.handleDocumentKeydown);
  }

  unsubscribe() {
    Object.values(this.timeline.children).forEach((child) => {
      if (typeof child.unsubscribe === 'function') {
        child.unsubscribe();
      }
    });

    window.removeEventListener('resize', this.handleWindowResize);
    document.removeEventListener('keydown', this.handleDocumentKeydown);
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

  highlightGenre(genre, artistNameToSkip = null) {
    const {plot} = this.timeline.children;
    const lastPoints = {};

    this.genrePointRegistry.getItemList(genre).forEach((point) => {
      const {x, y, scrobble: {artist: {name: artistName}, highlightedGenreColor}} = point;

      if (artistName !== artistNameToSkip) {
        this.pointCollectionHighlighted.push({x, y});
        lastPoints[artistName] = point;
        plot.drawPoint(x, y, highlightedGenreColor);
      }
    });

    return lastPoints;
  }

  highlightArtist({index, artist, track}) {
    const {timeline: {point: {selectedColor: selectedTrackColor}}} = config;
    const {plot, selectedScrobbleTimeLabel} = this.timeline.children;
    const [plotWidth] = plot.getDimensions();
    const sameTrackPointList = [];
    let lastPoint = null;

    this.artistPointRegistry.getItemList(artist.name).forEach((point) => {
      const {
        x,
        y,
        scrobble: {
          index: scrobbleGlobalIndex,
          timestamp,
          track: {name},
          highlightedArtistColor,
        },
      } = point;

      this.pointCollectionHighlighted.push({x, y});
      lastPoint = point;

      // skipping same track scrobbles, those will be rendered after the main loop (to appear on top)
      if (name === track.name) {
        sameTrackPointList.push({x, y});
      } else {
        plot.drawPoint(x, y, highlightedArtistColor);
      }

      if (scrobbleGlobalIndex === index) {
        selectedScrobbleTimeLabel.renderText(x, timestampToDateTimeString(timestamp), plotWidth);
      }
    });

    sameTrackPointList.forEach(({x, y}) => plot.drawPoint(x, y, selectedTrackColor));

    return lastPoint;
  }

  removePointsHighlight() {
    const {pointBuffer} = this.timeline;
    const {plot} = this.timeline.children;

    this.pointCollectionHighlighted.getAll().forEach(
      ({x, y}) => plot.drawPoint(x, y, pointBuffer.getPoint(x, y).scrobble.color),
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
    this.renderArtistsLabels(this.highlightGenre(genre));
    legend.highlightGenre(genre);
  }

  selectScrobble(scrobble) {
    const {summary} = this.props;
    const {plot, infoBox, legend, artistLabelCollection} = this.timeline.children;
    const [plotWidth] = plot.getDimensions();
    const {artist} = scrobble;
    const isNewArtist = !(this.selectedScrobble && this.selectedScrobble.artist.name === artist.name);
    let otherArtistsLastScrobblePoints = {};

    this.selectedScrobble = scrobble;
    this.removePointsHighlight();
    infoBox.hideIntroMessage();

    // there's no need to re-render genre-related labels if selected artist didn't change
    if (isNewArtist) {
      legend.removeGenreHighlight();
      artistLabelCollection.removeAllLabels();
    }

    if (artist.genre) {
      otherArtistsLastScrobblePoints = this.highlightGenre(artist.genre, artist.name);

      if (isNewArtist) {
        legend.highlightGenre(artist.genre);
      }
    }

    // artist scrobbles are rendered on top of genre scrobbles
    const artistLastScrobblePoint = this.highlightArtist(scrobble);

    // artist label is inserted before other artists labels
    if (isNewArtist) {
      artistLabelCollection.renderLabel({text: artist.name, ...artistLastScrobblePoint}, plotWidth, true);
      this.renderArtistsLabels(otherArtistsLastScrobblePoints);
    }

    infoBox.renderScrobbleInfo(scrobble, summary.getScrobbleTotals(scrobble));
  }

  selectVerticallyAdjacentScrobble(shift) {
    const {scrobbleCollection} = this.timeline;

    if (this.selectedScrobble) {
      const adjacentScrobble = scrobbleCollection.getAdjacentVisible(this.selectedScrobble.index, shift);

      if (adjacentScrobble) {
        this.selectScrobble(adjacentScrobble);
      }
    }
  }

  selectHorizontallyAdjacentScrobble(shift) {
    const {scrobbleCollection} = this.timeline;

    if (this.selectedScrobble) {
      const filter = ({artist: {playcount}}) => playcount === this.selectedScrobble.artist.playcount;
      const adjacentScrobble = scrobbleCollection.getAdjacentVisible(this.selectedScrobble.index, shift, filter);

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
    const {scrobbleCollection, plotScales: {x: timeRangeScale}} = this.timeline;
    const {offsetX: x} = event;
    const {timestamp: minTimestamp} = scrobbleCollection.getFirst();
    const {timestamp: maxTimestamp} = scrobbleCollection.getLast();
    const [leftTimestamp, rightTimestamp] = timeRangeScale.domain().map((date) => Date.parse(date));

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
    const {scrobbleCollection, plotScales: {x: timeRangeScale}} = this.timeline;
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
          scrobbleCollection.getFirst().timestamp,
        ),
        Math.min(
          xTimestamp + rightTimeDiff,
          scrobbleCollection.getLast().timestamp,
        ),
      );
    }
  }

  updatePlotTimeRange(leftTimestamp, rightTimestamp) {
    const {scrobbleCollection, plotScales: {x: timeRangeScale}} = this.timeline;
    const {index: leftIndex} = scrobbleCollection.findFirst(({timestamp}) => timestamp >= leftTimestamp);
    const {index: rightIndex} = scrobbleCollection.findLast(({timestamp}) => timestamp <= rightTimestamp);

    timeRangeScale.domain([
      leftTimestamp,
      rightTimestamp,
    ]);

    scrobbleCollection.setVisibleIndexRange(
      leftIndex,
      rightIndex,
    );

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

  afterRender() {
    this.timeline.afterRender();
    this.subscribe();
  }

  renderArtistsLabels(points) {
    const {plot, artistLabelCollection} = this.timeline.children;
    const [plotWidth] = plot.getDimensions();

    // points are sorted by Y coord (i.e. artist total playcount),
    // so labels are also sorted and are getting placed closer to their points
    Object.entries(points)
      .map(([text, point]) => ({text, ...point}))
      .sort((a, b) => b.y - a.y)
      .forEach((point) => artistLabelCollection.renderLabel(point, plotWidth, false));
  }
}
