export default class ArtistRegistry {
  constructor() {
    this.registry = {};
  }

  reset() {
    this.registry = {};
  }

  putScrobble(x, y, scrobble, index) {
    const {artist: {name}} = scrobble;

    if (!this.registry[name]) {
      this.registry[name] = [];
    }

    this.registry[name].push({
      ...scrobble,
      index,
      x,
      y,
    });
  }

  getArtistScrobbleList(artistName) {
    return this.registry[artistName];
  }
}
