import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';

import config from '../config';

export function insertColors(scrobbleList, maxAlbumPlaycount) {
  const {timeline: {point: {colorValueFactors}, unknownGenreColorRange}, genreGroups} = config;
  const createColorScale = (range) => d3Scale.scaleSequential()
    .domain([1, maxAlbumPlaycount])
    .range(range);
  const unknownGenreColorScale = createColorScale(unknownGenreColorRange);
  const genreGroupColorScales = {};

  Object.entries(genreGroups).forEach(
    ([genreGroup, {colorRange}]) => genreGroupColorScales[genreGroup] = createColorScale(colorRange),
  );

  return scrobbleList.map((scrobble) => {
    const {artist: {genreGroup}, album: {playcount}} = scrobble;
    const colorScale = genreGroupColorScales[genreGroup] || unknownGenreColorScale;
    const baseColor = colorScale(playcount);

    const color = d3Color.hsl(baseColor);
    color.s *= colorValueFactors.other.saturation;
    color.l *= colorValueFactors.other.lightness;

    const highlightedGenreColor = d3Color.hsl(baseColor);
    highlightedGenreColor.s *= colorValueFactors.genre.saturation;
    highlightedGenreColor.l *= colorValueFactors.genre.lightness;

    const highlightedArtistColor = d3Color.hsl(baseColor);
    highlightedArtistColor.s *= colorValueFactors.artist.saturation;
    highlightedArtistColor.l *= colorValueFactors.artist.lightness;

    const artistLabelColor = d3Color.hsl(baseColor);
    artistLabelColor.s *= colorValueFactors.artistLabel.saturation;
    artistLabelColor.l *= colorValueFactors.artistLabel.lightness;

    [
      color,
      highlightedGenreColor,
      highlightedArtistColor,
      artistLabelColor,
    ].forEach((c) => {
      if (c.s > 1) { c.s = 1; }
      if (c.l > 1) { c.l = 1; }
    });

    return {
      ...scrobble,
      color,
      highlightedGenreColor,
      highlightedArtistColor,
      artistLabelColor,
    };
  });
}
