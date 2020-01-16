export default class Collection {
  constructor(list = []) {
    this.list = list;
  }

  reset() {
    this.list = [];
  }

  push(item) {
    this.list.push(item);
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

  getNext(filter) {
    for (let i = 0; i < this.list.length; i += 1) {
      const item = this.list[i];

      if (filter(item)) {
        return item;
      }
    }

    return null;
  }

  getPrevious(filter) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const item = this.list[i];

      if (filter(item)) {
        return item;
      }
    }

    return null;
  }

  getAdjacent(item, shift, filter = () => true) {
    let {index} = item;
    const {index: firstIndex} = this.getFirst();
    const {index: lastIndex} = this.getLast();
    const stepCondition = shift > 0
      ? () => index < lastIndex
      : () => index > firstIndex;

    while (stepCondition()) {
      index += shift;
      const adjacentItem = this.list.find(({index: i}) => i === index);

      if (adjacentItem && filter(adjacentItem)) {
        return adjacentItem;
      }
    }

    return null;
  }
}
