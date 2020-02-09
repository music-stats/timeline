import {createProxyMethod} from '../utils/decorator';

export default class PlotInteractive {
  constructor(props, plot) {
    this.props = props;
    this.plot = plot;

    [
      'getDimensions',
      'scale',
      'drawBackground',
      'drawTimeAxis',
      'drawPoint',
      'render',
    ].forEach(createProxyMethod(this, this.plot));
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

  afterRender() {
    this.plot.afterRender();
    this.subscribe();
  }
}
