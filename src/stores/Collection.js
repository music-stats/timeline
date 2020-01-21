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

    return undefined;
  }
}
