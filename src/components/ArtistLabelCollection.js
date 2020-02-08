import html from '../lib/html';
import config from '../config';

import './ArtistLabelCollection.css';

export default class ArtistLabelCollection {
  constructor() {
    this.element = null;
    this.highlightedLabelElement = null;
    this.bboxList = [];
  }

  initializeElements() {
    this.element = document.getElementById('artist-labels');
  }

  removeAllLabels() {
    this.element.innerHTML = '';
    this.highlightedLabelElement = null;
    this.bboxList = [];
  }

  getLabelMinX(x, width, areaWidth) {
    const {timeline: {labels: {areaPadding}}} = config;
    const halfWidth = Math.ceil(width / 2);

    // stick to left
    if (x - halfWidth < areaPadding) {
      return areaPadding;
    }

    // stick to right
    if (x + halfWidth > areaWidth - areaPadding) {
      return areaWidth - areaPadding - width;
    }

    // center at "x"
    return x - halfWidth;
  }

  getLabelMinY(minX, maxX, y, height) {
    const {timeline: {labels: {margin}}} = config;

    // filtering out bounding boxes that don't collide by X
    const bboxListVertical = this.bboxList
      .filter((bbox) => !(
        minX > bbox.maxX + margin ||
        maxX < bbox.minX - margin
      ))
      .sort((a, b) => b.minY - a.minY);

    let minY = y;
    let maxY = y + height;

    // checking if each bbox collides by Y and shifting up by its height when it does
    for (const bbox of bboxListVertical) {
      if (!(
        minY > bbox.maxY + margin ||
        maxY < bbox.minY - margin
      )) {
        maxY = bbox.minY - margin;
        minY = maxY - height;
      }
    }

    return minY;
  }

  renderLabel({x, y, text, scrobble: {artistLabelColor}}, areaWidth, isHighlighted = false) {
    const {timeline: {labels: {highlightedColor}}} = config;
    const labelElement = document.createElement('span');
    const color = isHighlighted
      ? highlightedColor
      : artistLabelColor;

    labelElement.classList.add('ArtistLabelCollection__label');
    labelElement.innerText = text;

    if (isHighlighted) {
      if (this.highlightedLabelElement) {
        this.highlightedLabelElement.classList.remove('ArtistLabelCollection__label--highlighted');
      }

      labelElement.classList.add('ArtistLabelCollection__label--highlighted');
      this.highlightedLabelElement = labelElement;
    }

    this.element.appendChild(labelElement);

    // text must be rendered (added to DOM) before element dimensions are measured
    const {offsetWidth, offsetHeight} = labelElement;

    const minX = this.getLabelMinX(x, offsetWidth, areaWidth);
    const maxX = minX + offsetWidth;
    const minY = this.getLabelMinY(minX, maxX, y, offsetHeight);
    const maxY = minY + offsetHeight;

    this.bboxList.push({
      minX,
      minY,
      maxX,
      maxY,
    });

    Object.assign(
      labelElement.style,
      {
        top: `${minY}px`,
        left: `${minX}px`,
        color,
      },
    );
  }

  afterRender() {
    this.initializeElements();
  }

  render() {
    const {timeline: {plot: {padding: plotPadding}, legend: {height: legendHeight}}} = config;

    return html`
      <aside
        id="artist-labels"
        class="ArtistLabelCollection"
        style="bottom: ${legendHeight + plotPadding}px"
      />
    `;
  }
}
