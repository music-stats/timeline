export default class ScrobbleCollection {
  constructor(scrobbleList) {
    this.scrobbleList = scrobbleList;
  }

  getFirst() {
    return this.scrobbleList[0];
  }

  getLast() {
    return this.scrobbleList[this.scrobbleList.length - 1];
  }

  getAdjacent(scrobble, shift, filter = () => true) {
    let {index} = scrobble;
    const stepCondition = shift > 0
      ? () => index < this.scrobbleList.length - 1
      : () => index > 0;

    while (stepCondition()) {
      index += shift;
      const adjacentScrobble = this.scrobbleList[index];

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
