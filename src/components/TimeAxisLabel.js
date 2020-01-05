import html from '../lib/html';
import config from '../config';

import './TimeAxisLabel.css';

export default class TimeAxisLabel {
  constructor() {
    this.element = null;
  }

  initializeElement() {
    const {
      timeline: {
        plot: {padding: plotPadding},
        timeAxis: {width: timeAxisWidth},
        legend: {height: legendHeight},
      },
    } = config;

    const height = plotPadding - timeAxisWidth / 2;

    this.element = document.getElementById('time-axis-label');
    this.element.style.top = `calc(100% - ${(height + legendHeight + plotPadding)}px)`;
    this.element.style.lineHeight = `${height}px`;
  }

  clear() {
    this.element.innerText = '';
  }

  renderText(x, canvasWidth, value) {
    const {timeline: {point: {size: padding}}} = config;

    this.element.innerText = value;

    // text must be rendered before the "offsetWidth" is measured
    const halfWidth = Math.ceil(this.element.offsetWidth / 2);

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

    this.element.style.left = left;
    this.element.style.right = right;
  }

  afterRender() {
    this.initializeElement();
  }

  render() {
    return html`
      <aside
        id="time-axis-label"
        class="TimeAxisLabel"
      >
      </aside>
    `;
  }
}
