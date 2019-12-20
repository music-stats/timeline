import html from '../lib/html';
import config from '../config';

import './TimeAxisLabel.css';

export default class TimeAxisLabel {
  constructor(props) {
    this.props = props;
    this.element = null;
  }

  initializeElement() {
    const {timeline: {plot: {padding: plotPadding}}} = config;
    const {pointHalfSize} = this.props;

    this.element = document.getElementById('time-axis-label');
    this.element.style.top = `calc(100vh - ${plotPadding - pointHalfSize}px)`;
  }

  clear() {
    this.element.innerText = '';
  }

  renderText(x, canvasWidth, value) {
    const {pointHalfSize} = this.props;

    // text must be rendered before the "offsetWidth" is measured
    this.element.innerText = value;

    const halfWidth = Math.ceil(this.element.offsetWidth / 2);
    const [left, right] = (() => {
      // stick to left
      if (x - halfWidth < pointHalfSize) {
        return [`${pointHalfSize}px`, 'auto'];
      }

      // stick to right
      if (x + halfWidth > canvasWidth - pointHalfSize) {
        return ['auto', `${pointHalfSize}px`];
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
