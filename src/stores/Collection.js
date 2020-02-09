export default class Collection {
  constructor(list = []) {
    this.list = list;
    this.firstVisibleIndex = 0;
    this.lastVisibleIndex = this.list.length - 1;
  }

  reset() {
    this.list = [];
    this.firstVisibleIndex = 0;
    this.lastVisibleIndex = 0;
  }

  setVisibleIndexRange(firstVisibleIndex, lastVisibleIndex) {
    this.firstVisibleIndex = firstVisibleIndex;
    this.lastVisibleIndex = lastVisibleIndex;
  }

  push(...items) {
    return this.list.push(...items);
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

  getFirstVisible() {
    return this.list[this.firstVisibleIndex];
  }

  getLastVisible() {
    return this.list[this.lastVisibleIndex];
  }

  forEachVisible(callback) {
    for (let i = this.firstVisibleIndex; i <= this.lastVisibleIndex; i += 1) {
      callback(this.list[i]);
    }
  }

  findFirst(filter) {
    return this.list.find(filter);
  }

  findLast(filter) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const item = this.list[i];

      if (filter(item)) {
        return item;
      }
    }

    return undefined;
  }

  getAdjacentVisible(index, shift, filter = () => true) {
    const stepCondition = shift > 0
      ? () => index < this.lastVisibleIndex
      : () => index > this.firstVisibleIndex;

    while (stepCondition()) {
      index += shift;
      const adjacentItem = this.list[index];

      if (adjacentItem && filter(adjacentItem)) {
        return adjacentItem;
      }
    }

    return undefined;
  }
}
