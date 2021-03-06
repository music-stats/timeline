export default class Registry {
  constructor(getKey) {
    this.getKey = getKey;
    this.registry = {};
  }

  reset() {
    this.registry = {};
  }

  putItem(item) {
    const key = this.getKey(item);

    if (!key) {
      return;
    }

    if (!this.registry[key]) {
      this.registry[key] = [];
    }

    this.registry[key].push(item);
  }

  getItemList(key) {
    return this.registry[key] || [];
  }

  filter(filter) {
    const registry = {};

    for (const key in this.registry) {
      const itemList = this.registry[key];

      if (filter(itemList)) {
        registry[key] = itemList;
      }
    }

    return registry;
  }
}
