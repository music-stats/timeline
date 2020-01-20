export default class PointBuffer {
  constructor(tolerance) {
    this.tolerance = tolerance;
    this.buffer = {};
  }

  reset() {
    this.buffer = {};
  }

  forEachPoint(callback) {
    for (const yi in this.buffer) {
      const yiBuffer = this.buffer[yi];

      for (const xj in yiBuffer) {
        callback(xj, yi, yiBuffer[xj]);
      }
    }
  }

  putPoint({x, y, ...point}) {
    // y-coord is the first lookup index
    // because in ".getPoint()" it's faster to locate "buffer[y]" entries (rows)
    // since there are as many rows as the largest artist playcount value,
    // which is generally less then it would have been columns (x-coords spread)
    if (!this.buffer[y]) {
      this.buffer[y] = {};
    }

    this.buffer[y][x] = point;
  }

  getPoint(x, y) {
    const yBuffer = this.buffer[y];

    return yBuffer
      ? yBuffer[x]
      : undefined;
  }

  getPointWithTolerance(x, y) {
    const xFrom = x - this.tolerance;
    const xTo = x + this.tolerance;
    const yFrom = y - this.tolerance;
    const yTo = y + this.tolerance;

    for (let yi = yFrom; yi <= yTo; yi += 1) {
      const yiBuffer = this.buffer[yi];

      if (yiBuffer) {
        for (let xj = xFrom; xj <= xTo; xj += 1) {
          const point = yiBuffer[xj];

          if (point) {
            return point;
          }
        }
      }
    }

    return undefined;
  }
}
