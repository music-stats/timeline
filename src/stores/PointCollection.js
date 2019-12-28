export default class PointCollection {
  constructor(list = []) {
    this.list = list;
  }

  reset() {
    this.list = [];
  }

  push(point) {
    this.list.push(point);
  }

  getAll() {
    return this.list;
  }

  getFirst() {
    return this.list[0];
  }

  getLast() {
    return this.list[this.list.length - 1];
  }

  getNext(timestamp) {
    for (let i = 0; i < this.list.length; i += 1) {
      const point = this.list[i];

      if (point.timestamp >= timestamp) {
        return point;
      }
    }

    return null;
  }

  getPrevious(timestamp) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const point = this.list[i];

      if (point.timestamp <= timestamp) {
        return point;
      }
    }

    return null;
  }

  getAdjacent(point, shift, filter = () => true) {
    let {index} = point;
    const stepCondition = shift > 0
      ? () => index < this.list.length - 1
      : () => index > 0;

    while (stepCondition()) {
      index += shift;
      const adjacentPoint = this.list[index];

      if (filter(adjacentPoint)) {
        return {
          ...adjacentPoint,
          index,
        };
      }
    }

    return null;
  }
}
