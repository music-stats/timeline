import * as d3Color from 'd3-color';
import html from '../lib/html';
import config from '../config';

import './ArtistLabelCollection.css';

export default class ArtistLabelCollection {
  constructor() {
    this.element = null;
    this.labelElementList = [];
    this.highlightedLabelElement = null;
  }

  initializeElements() {
    this.element = document.getElementById('artist-labels');
  }

  removeAllLabels() {
    this.labelElementList.forEach((labelElement) => labelElement.remove());
    this.labelElementList = [];
    this.highlightedLabelElement = null;
  }

  renderLabel(x, y, canvasWidth, value, baseColor, isHighlighted = false) {
    const {timeline: {point: {size: padding, colorValueFactors}}} = config;
    const labelElement = document.createElement('span');
    const color = d3Color.hsl(baseColor);

    color.s *= colorValueFactors.artistLabel.saturation;
    color.l *= colorValueFactors.artistLabel.lightness;

    labelElement.classList.add('ArtistLabelCollection__label');
    labelElement.innerText = value;

    Object.assign(
      labelElement.style,
      {
        top: `${y}px`,
        color: color,
      },
    );

    if (isHighlighted) {
      if (this.highlightedLabelElement) {
        this.highlightedLabelElement.remove();
      }

      labelElement.style.fontWeight = 'bold';
      this.highlightedLabelElement = labelElement;
    }

    this.labelElementList.push(labelElement);
    this.element.appendChild(labelElement);

    // text must be rendered (added to DOM) before "offsetWidth" is measured
    const halfWidth = Math.ceil(labelElement.offsetWidth / 2);

    const [left, right] = (() => {
      // stick to left
      if (x - halfWidth < padding) {
        return [`${padding}px`, 'auto'];
      }

      // stick to right
      if (x + halfWidth > canvasWidth - padding) {
        return ['auto', `${padding}px`];
      }

      // center under "x"
      return [`${x - halfWidth}px`, 'auto'];
    })();

    Object.assign(
      labelElement.style,
      {
        left,
        right,
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