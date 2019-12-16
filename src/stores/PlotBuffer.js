export default class PlotBuffer {
  constructor(tolerance) {
    this.tolerance = tolerance;
    this.buffer = {};
  }

  reset() {
    this.buffer = {};
  }

  putPoint(x, y, point, index, color) {
    // y-coord is first because of horizontal traversal optimization
    if (!this.buffer[y]) {
      this.buffer[y] = {};
    }

    this.buffer[y][x] = {
      ...point,
      index,
      color,
    };
  }

  getPoint(x, y) {
    const xFrom = x - this.tolerance;
    const xTo = x + this.tolerance;
    const yFrom = y - this.tolerance;
    const yTo = y + this.tolerance;

    for (let yi = yFrom; yi <= yTo; yi += 1) {
      const yBuffer = this.buffer[yi];

      if (yBuffer) {
        for (let xj = xFrom; xj <= xTo; xj += 1) {
          const point = yBuffer[xj];

          if (point) {
            return point;
          }
        }
      }
    }

    return null;
  }

  getHorizontallyAdjacentPoint({x, y}, shift) {
    const yBuffer = this.buffer[y];
    const xList = Object.keys(yBuffer);
    const prevX = xList[xList.indexOf(x.toString()) + shift];

    return yBuffer[prevX];
  }
}
