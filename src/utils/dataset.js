import config from '../config';
import {dateTimeStringToTimestamp} from './date';

export function enrichScrobbleList(scrobbleList, artistsByGenres) {
  const {genreGroups} = config;
  const genreGroupsByGenres = {};
  const genresByArtists = {};

  for (const genreGroup in genreGroups) {
    genreGroups[genreGroup].genres.forEach((genre) => genreGroupsByGenres[genre] = genreGroup);
  }

  for (const genre in artistsByGenres) {
    artistsByGenres[genre].forEach((artistName) => genresByArtists[artistName] = genre);
  }

  return scrobbleList.map((scrobble, index) => {
    const genre = genresByArtists[scrobble.artist.name];
    const genreGroup = genreGroupsByGenres[genre];
    const timestamp = dateTimeStringToTimestamp(scrobble.date);

    return {
      ...scrobble,
      ...(genre && {
        artist: {
          ...scrobble.artist,
          genreGroup, // e.g. 'Rock'
          genre, // e.g. 'Classic Rock'
        },
      }),
      index,
      timestamp,
    };
  });
}
