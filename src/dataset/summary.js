export default function getSummary(scrobbleList) {
  const registry = {};

  scrobbleList.forEach(({artist, album, track}) => {
    if (!registry[artist.name]) {
      // The same track can appear on different albums, so track playcount values are not nested into albums.
      // It matches aggregation logic in "music-stats/scripts/src/ETL/transformers/aggregate.ts".
      registry[artist.name] = {
        albums: {},
        tracks: {},
      };
    }

    registry[artist.name].playcount = artist.playcount;

    // album name could be empty
    if (album.name) {
      registry[artist.name].albums[album.name] = album.playcount;
    }

    registry[artist.name].tracks[track.name] = track.playcount;
  });

  const artistCount = Object.keys(registry).length;
  let albumCount = 0;
  let trackCount = 0;
  let maxArtistPlaycount = 0;
  let maxAlbumPlaycount = 0;

  for (const artistName in registry) {
    const {playcount, albums, tracks} = registry[artistName];

    albumCount += Object.keys(albums).length;
    trackCount += Object.keys(tracks).length;

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

  const scrobbleCount = scrobbleList.length;
  const msInDay = 24 * 60 * 60 * 1000;
  const dayCount = Math.ceil((scrobbleList[scrobbleList.length - 1].timestamp - scrobbleList[0].timestamp) / msInDay);
  const scrobblePerDayCount = Math.round(10 * scrobbleCount / dayCount) / 10;

  return {
    artistCount,
    albumCount,
    trackCount,
    maxArtistPlaycount,
    maxAlbumPlaycount,
    scrobbleCount,
    scrobblePerDayCount,

    getScrobbleTotals: ({artist, album, track}) => {
      const {playcount, albums, tracks} = registry[artist.name];

      return {
        artist: playcount,
        album: albums[album.name],
        track: tracks[track.name],
      };
    },
  };
}
