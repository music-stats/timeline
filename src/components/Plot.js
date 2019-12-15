import html from '../lib/html';

import './Plot.css';

export default class Plot {
  constructor(props) {
    this.props = props;

    this.dimensions = null;
    this.element = null;
    this.ctx = null;
  }

  initializeElement() {
    this.element = document.getElementById('plot-canvas');
  }

  subscribe() {
    const {onMouseMove} = this.props;

    this.element.addEventListener('mousemove', onMouseMove);
  }

  getDimensions() {
    return this.dimensions;
  }

  scale() {
    const dpr = window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.dimensions = [width, height];

    this.element.width = width * dpr;
    this.element.height = height * dpr;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;

    this.ctx = this.element.getContext('2d', {alpha: false});
    this.ctx.scale(dpr, dpr);
  }

  drawBackground() {
    const {colors} = this.props;
    const [width, height] = this.dimensions;

    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawTimeAxis(xFrom, xTo) {
    const {padding, timeAxisWidth, colors} = this.props;
    const height = this.dimensions[1];
    const y = height - padding;

    this.ctx.strokeStyle = colors.timeAxis;
    this.ctx.lineWidth = timeAxisWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(xFrom, y);
    this.ctx.lineTo(xTo, y);
    this.ctx.stroke();
  }

  drawPoint(x, y, color) {
    const {pointSize, pointHalfSize} = this.props;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x - pointHalfSize,
      y - pointHalfSize,
      pointSize,
      pointSize,
    );
  }

  afterRender() {
    this.initializeElement();
    this.subscribe();
  }

  render() {
    return html`
      <canvas
        id="plot-canvas"
        class="Plot"
      />
    `;
  }
}
