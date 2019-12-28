import {dateTimeStringToTimestamp} from './date';

export function enrichScrobbleList(scrobbleList, artistsByGenres) {
  const genresByArtists = {};

  for (const genre in artistsByGenres) {
    artistsByGenres[genre].forEach((artistName) => genresByArtists[artistName] = genre);
  }

  scrobbleList.forEach((scrobble, index) => {
    const genre = genresByArtists[scrobble.artist.name];

    if (genre) {
      scrobble.artist.genre = genre;
    }

    scrobble.index = index;
    scrobble.timestamp = dateTimeStringToTimestamp(scrobble.date);
  });
}
