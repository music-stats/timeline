import html from '../lib/html';
import config from '../config';

import './Plot.css';

export default class Plot {
  constructor(props) {
    this.props = props;
    this.dimensions = null;
    this.element = null;
    this.ctx = null;
  }

  initializeElement() {
    this.element = document.getElementById('plot');
  }

  getDimensions() {
    return this.dimensions;
  }

  scale() {
    const {timeline: {plot: {padding}, legend: {height: legendHeight}}} = config;
    const dpr = window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight - (legendHeight + padding);

    this.dimensions = [width, height];

    // batch assignment is used to minimize reflows
    Object.assign(
      this.element,
      {
        width: width * dpr,
        height: height * dpr,
      },
    );

    Object.assign(
      this.element.style,
      {
        width: `${width}px`,
        height: `${height}px`,
      },
    );

    this.ctx = this.element.getContext('2d', {alpha: false});
    this.ctx.scale(dpr, dpr);
  }

  drawBackground() {
    const {timeline: {plot: {backgroundColor}}} = config;
    const [width, height] = this.dimensions;

    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawTimeAxis(xFrom, xTo) {
    const {timeline: {plot: {padding}, timeAxis: {width, color}}} = config;
    const height = this.dimensions[1];
    const y = height - padding;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(xFrom, y);
    this.ctx.lineTo(xTo, y);
    this.ctx.stroke();
  }

  drawPoint(x, y, color) {
    const {timeline: {point: {size: pointSize}}} = config;
    const {pointHalfSize} = this.props;

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
  }

  render() {
    return html`
      <canvas
        id="plot"
        class="Plot"
      />
    `;
  }
}
