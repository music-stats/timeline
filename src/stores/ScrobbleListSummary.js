export default class ScrobbleListSummary {
  constructor(scrobbleList) {
    this.registry = {};

    this.counts = {
      artistCount: 0,
      albumCount: 0,
      trackCount: 0,
    };

    this.maxArtistPlaycount = 0;
    this.maxAlbumPlaycount = 0;

    this.initialize(scrobbleList);
  }

  initialize(scrobbleList) {
    scrobbleList.forEach(({artist, album, track}) => {
      if (!this.registry[artist.name]) {
        // The same track can appear on different albums, so track playcount values are not nested into albums.
        // It matches aggregation logic in "music-stats/scripts/src/ETL/transformers/aggregate.ts".
        this.registry[artist.name] = {
          albums: {},
          tracks: {},
        };
      }

      this.registry[artist.name].playcount = artist.playcount;

      // album name could be empty
      if (album.name) {
        this.registry[artist.name].albums[album.name] = album.playcount;
      }

      this.registry[artist.name].tracks[track.name] = track.playcount;
    });

    this.counts.artistCount = Object.keys(this.registry).length;

    for (const artistName in this.registry) {
      const {playcount, albums, tracks} = this.registry[artistName];

      this.counts.albumCount += Object.keys(albums).length;
      this.counts.trackCount += Object.keys(tracks).length;

      if (playcount > this.maxArtistPlaycount) {
        this.maxArtistPlaycount = playcount;
      }

      for (const albumName in albums) {
        const albumPlaycount = albums[albumName];

        if (albumPlaycount > this.maxAlbumPlaycount) {
          this.maxAlbumPlaycount = albumPlaycount;
        }
      }
    }
  }

  getCounts() {
    return this.counts;
  }

  getMaxArtistPlaycount() {
    return this.maxArtistPlaycount;
  }

  getMaxAlbumPlaycount() {
    return this.maxAlbumPlaycount;
  }

  getTotals({artist, album, track}) {
    const {playcount, albums, tracks} = this.registry[artist.name];

    return [
      playcount,
      albums[album.name],
      tracks[track.name],
    ];
  }
}
