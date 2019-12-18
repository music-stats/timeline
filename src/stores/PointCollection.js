export default class PointCollection {
  constructor(list) {
    this.list = list;
  }

  getFirst() {
    return this.list[0];
  }

  getLast() {
    return this.list[this.list.length - 1];
  }

  getAdjacent(point, shift, filter = () => true) {
    let {index} = point;
    const stepCondition = shift > 0
      ? () => index < this.list.length - 1
      : () => index > 0;

    while (stepCondition()) {
      index += shift;
      const adjacentScrobble = this.list[index];

      if (filter(adjacentScrobble)) {
        return {
          ...adjacentScrobble,
          index,
        };
      }
    }

    return null;
  }
}
