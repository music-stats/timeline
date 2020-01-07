import cssColors from './app-theme';

export default {
  dataUrls: {
    scrobbles: 'data/scrobbles.json',
    artistsByGenres: 'data/artists-by-genres.json',
  },

  links: {
    lastfm: {
      url: 'https://www.last.fm/user/markhovskiy/',
      text: 'markhovskiy',
    },

    github: {
      url: 'https://github.com/music-stats/timeline/',
      text: 'music-stats/timeline',
    },

    twitter: {
      url: 'https://twitter.com/oleksmarkh/',
      text: '@oleksmarkh',
    },
  },

  timeline: {
    zoomDeltaFactor: 0.01,
    minTimeRange: 24 * 60 * 60 * 1000, // 1 day

    plot: {
      padding: 12,
      backgroundColor: cssColors.darkGreyBlue,
    },

    point: {
      size: 4,
      maxMargin: 1,
      selectedColor: cssColors.white,
      colorValueFactors: {
        other: {
          saturation: 0.5,
          lightness: 0.6,
        },
        genre: {
          saturation: 1.1,
          lightness: 1,
        },
        artistLabel: {
          saturation: 1.4,
          lightness: 1.6,
        },
        artist: {
          saturation: 1.4,
          lightness: 1.8,
        },
      },
    },

    timeAxis: {
      width: 2,
      color: cssColors.darkGrey2,
    },

    legend: {
      height: 140,
    },

    scales: {
      albumPlaycount: {
        range: [
          0.8,
          0.4,
        ],
      },
    },
  },

  genreGroups: {
    'Classical': {
      // grey
      colorRange: ['#bdbdbd', '#f0f0f0'],

      genres: [
        'Classical',
        'Tango',
      ],
    },

    'Electronic': {
      // brown
      colorRange: ['#cc4c02', '#fec44f'],

      genres: [
        'Electronic',
        'Ambient',
        'Darkwave',
        'Industrial',
        'Trip Hop',
        'Dream Pop',
      ],
    },

    'Jazzy': {
      // yellow
      colorRange: ['#fec44f', '#fff7bc'],

      genres: [
        'Jazz',
        'Blues',
        'Rockabilly',
        'Rock And Roll',
        'Funk',
        'Hip-hop',
      ],
    },

    'Folk': {
      // green
      colorRange: ['#238b45', '#a1d99b'],

      genres: [
        'Folk',
        'Bluegrass',
        'Folk Rock',
        'Folk Metal',
        'Dark Folk',
        'Freak Folk',
      ],
    },

    'Pop': {
      // green-blue
      colorRange: ['#02818a', '#a6bddb'],

      genres: [
        'Pop',
        'Singer-songwriter',
        'Art Pop',
      ],
    },

    'Rock': {
      // blue
      colorRange: ['#2171b5', '#9ecae1'],

      genres: [
        'Classic Rock',
        'Alternative Rock',
        'Gothic Rock',
        'Grunge',
        'Indie Rock',
        'Post-rock',
        'Progressive Rock',
        'Stoner Rock',
        'Industrial Rock',
      ],
    },

    'Metal': {
      // violet
      colorRange: ['#88419d', '#9ebcda'],

      genres: [
        'Black Metal',
        'Post-black',
        'Heavy Metal',
        'Power Metal',
        'Speed Metal',
        'Symphonic Metal',
        'Progressive Metal',
        'Gothic Metal',
        'Thrash Metal',
        'Groove Metal',
        'Doom Metal',
        'Death Metal',
        'Melodic Death Metal',
        'Progressive Death Metal',
        'Industrial Metal',
        'Nu Metal',
        'Metalcore',
        'Deathcore',
        'Screamo',
        'Sludge Metal',
      ],
    },

    'Punk': {
      // pink
      colorRange: ['#ce1256', '#c994c7'],

      genres: [
        'Punk Rock',
        'Ska Punk',
        'Post-punk',
        'Hardcore',
      ],
    },
  },
};
