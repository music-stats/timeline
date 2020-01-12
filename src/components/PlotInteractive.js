export default class PlotInteractive {
  constructor(props, plot) {
    this.props = props;
    this.plot = plot;
  }

  subscribe() {
    const {onMouseDown, onMouseUp, onMouseOut, onMouseMove, onWheel} = this.props;
    const {element} = this.plot;

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseout', onMouseOut);
    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('wheel', onWheel);
  }

  getDimensions() {
    return this.plot.getDimensions();
  }

  scale() {
    this.plot.scale();
  }

  drawBackground() {
    this.plot.drawBackground();
  }

  drawTimeAxis(xFrom, xTo) {
    this.plot.drawTimeAxis(xFrom, xTo);
  }

  drawPoint(x, y, color) {
    this.plot.drawPoint(x, y, color);
  }

  afterRender() {
    this.plot.afterRender();
    this.subscribe();
  }

  render() {
    return this.plot.render();
  }
}
