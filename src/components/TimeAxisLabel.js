import html from '../lib/html';
import config from '../config';

import './TimeAxisLabel.css';

export default class TimeAxisLabel {
  constructor() {
    const {timeline: {point: {size}}} = config;

    this.element = null;
    this.padding = size;
  }

  initializeElement() {
    const {timeline: {plot: {padding: plotPadding}, timeAxis: {width: timeAxisWidth}}} = config;
    const height = plotPadding - timeAxisWidth / 2;

    this.element = document.getElementById('time-axis-label');
    this.element.style.top = `calc(100% - ${height}px)`;
    this.element.style.lineHeight = `${height}px`;
  }

  clear() {
    this.element.innerText = '';
  }

  renderText(x, canvasWidth, value) {
    // text must be rendered before the "offsetWidth" is measured
    this.element.innerText = value;

    const halfWidth = Math.ceil(this.element.offsetWidth / 2);
    const [left, right] = (() => {
      // stick to left
      if (x - halfWidth < this.padding) {
        return [`${this.padding}px`, 'auto'];
      }

      // stick to right
      if (x + halfWidth > canvasWidth - this.padding) {
        return ['auto', `${this.padding}px`];
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
