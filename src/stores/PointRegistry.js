export default class PointRegistry {
  constructor(getKey) {
    this.getKey = getKey;
    this.registry = {};
  }

  reset() {
    this.registry = {};
  }

  putPoint(point) {
    const key = this.getKey(point);

    if (!this.registry[key]) {
      this.registry[key] = [];
    }

    this.registry[key].push(point);
  }

  getPointList(key) {
    return this.registry[key];
  }
}
