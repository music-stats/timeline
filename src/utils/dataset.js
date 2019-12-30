import {dateTimeStringToTimestamp} from './date';

export function enrichScrobbleList(scrobbleList, artistsByGenres) {
  const genresByArtists = {};

  for (const genre in artistsByGenres) {
    artistsByGenres[genre].forEach((artistName) => genresByArtists[artistName] = genre);
  }

  return scrobbleList.map((scrobble, index) => {
    const genre = genresByArtists[scrobble.artist.name];
    const timestamp = dateTimeStringToTimestamp(scrobble.date);

    return {
      ...scrobble,
      ...(genre && {
        artist: {
          ...scrobble.artist,
          genre,
        },
      }),
      index,
      timestamp,
    };
  });
}
