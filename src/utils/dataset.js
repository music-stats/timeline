export function enrichArtistsWithGenres(scrobbleList, artistsByGenres) {
  const genresByArtists = {};

  for (const genre in artistsByGenres) {
    artistsByGenres[genre].forEach((artistName) => genresByArtists[artistName] = genre);
  }

  scrobbleList.forEach(({artist}) => {
    const genre = genresByArtists[artist.name];

    if (genre) {
      artist.genre = genre;
    }
  });
}
