export default class SummaryRegistry {
  constructor(scrobbleList) {
    this.registry = {};
    this.summary = {
      artistCount: 0,
      albumCount: 0,
      trackCount: 0,
    };

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

    this.summary.artistCount = Object.keys(this.registry).length;

    for (const artistName in this.registry) {
      const {albums, tracks} = this.registry[artistName];

      this.summary.albumCount += Object.keys(albums).length;
      this.summary.trackCount += Object.keys(tracks).length;
    }
  }

  getSummary() {
    return this.summary;
  }

  getTotals({artist, album, track}) {
    const {playcount, albums, tracks} = this.registry[artist.name];

    return [
      playcount,
      albums[album.name],
      tracks[track.name],
    ];
  }

  getMaxPlaycounts() {
    let maxArtistPlaycount = 0;
    let maxAlbumPlaycount = 0;

    for (const artistName in this.registry) {
      const {playcount, albums} = this.registry[artistName];

      if (playcount > maxArtistPlaycount) {
        maxArtistPlaycount = playcount;
      }

      for (const albumName in albums) {
        const albumPlaycount = albums[albumName];

        if (albumPlaycount > maxAlbumPlaycount) {
          maxAlbumPlaycount = albumPlaycount;
        }
      }
    }

    return [
      maxArtistPlaycount,
      maxAlbumPlaycount,
    ];
  }
}
