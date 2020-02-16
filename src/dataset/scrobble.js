export function uncompress([
  date,
  trackName,
  trackPlaycount,
  albumName,
  albumPlaycount,
  artistName,
  artistPlaycount,
]) {
  return {
    date,
    track: {
      name: trackName,
      playcount: trackPlaycount,
    },
    album: {
      name: albumName,
      playcount: albumPlaycount,
    },
    artist: {
      name: artistName,
      playcount: artistPlaycount,
    },
  };
}
