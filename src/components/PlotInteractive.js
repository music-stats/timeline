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

  unsubscribe() {
    const {onMouseDown, onMouseUp, onMouseOut, onMouseMove, onWheel} = this.props;
    const {element} = this.plot;

    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
    element.removeEventListener('mouseout', onMouseOut);
    element.removeEventListener('mousemove', onMouseMove);
    element.removeEventListener('wheel', onWheel);
  }

  afterRender() {
    this.plot.afterRender();
    this.subscribe();
  }
}
