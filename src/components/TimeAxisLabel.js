import html from '../lib/html';

import './TimeAxisLabel.css';

export default class TimeAxisLabel {
  constructor() {
    this.element = null;
  }

  initializeElement() {
    this.element = document.getElementById('time-axis-label');
  }

  clear() {
    this.element.innerText = '';
  }

  renderText(x, canvasWidth, scrobbleMargin, plotPadding, value) {
    const halfWidth = Math.ceil(this.element.offsetWidth / 2);
    const [left, right] = (() => {
      // stick to left
      if (x - halfWidth < scrobbleMargin) {
        return [`${scrobbleMargin}px`, 'auto'];
      }

      // stick to right
      if (x + halfWidth > canvasWidth - scrobbleMargin) {
        return ['auto', `${scrobbleMargin}px`];
      }

      // center under "x"
      return [`${x - halfWidth}px`, 'auto'];
    })();

    this.element.style.top = `calc(100vh - ${plotPadding - scrobbleMargin}px)`;
    this.element.style.left = left;
    this.element.style.right = right;

    this.element.innerText = value;
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
