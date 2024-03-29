import cssColors from './app-theme';

export default {
  debug: '__buildEnv__' !== 'production',

  defaultDataYear: '2024',

  dataUrls: {
    yearList: 'data/years.json',
    yearsBase: 'data/years',
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
  },

  timeline: {
    zoomDeltaFactor: 0.01,
    minTimeRange: 24 * 60 * 60 * 1000, // 1 day

    plot: {
      padding: 12,
      backgroundColor: cssColors.darkGreyBlue,
    },

    point: {
      size: 3,
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

    labels: {
      areaPadding: 4,
      margin: 1,
      highlightedHeight: 16, // not used for label styling, only for limiting plot Y-scale
      highlightedColor: cssColors.white,
    },

    timeAxis: {
      width: 2,
      tickLabelCount: 40,
      timeFullColor: cssColors.darkGrey2,
      timeRangeColor: cssColors.darkGrey3,
    },

    legend: {
      height: 150, // the longest genre label should fit
    },

    // grey
    unknownGenreColorRange: ['#525252', '#bdbdbd'],
  },

  genreGroups: {
    'Classical': {
      // light grey
      colorRange: ['#bdbdbd', '#f0f0f0'],

      genres: [
        'Classical',
        'Tango',
      ],
    },

    'Electronic, Pop': {
      // brown
      colorRange: ['#cc4c02', '#fec44f'],

      genres: [
        'Ambient',
        'Darkwave',
        'Dream Pop',
        'Electronic',
        'Indie Pop',
        'Industrial',
        'Pop',
        'Singer-songwriter',
        'Trip Hop',
      ],
    },

    'Jazzy': {
      // yellow
      colorRange: ['#fec44f', '#fff7bc'],

      genres: [
        'Blues',
        'Funk',
        'Hip-hop',
        'Jazz',
        'Low Rock',
        'Reggae',
        'Rock And Roll',
        'Rockabilly',
        'Soul',
      ],
    },

    'Folk': {
      // green
      colorRange: ['#238b45', '#a1d99b'],

      genres: [
        'Acoustic',
        'Bluegrass',
        'Dark Country',
        'Dark Folk',
        'Folk Metal',
        'Folk Rock',
        'Folk',
        'Folktronica',
        'Freak Folk',
        'Ukrainian Retro',
      ],
    },

    'Rock': {
      // blue
      colorRange: ['#2171b5', '#9ecae1'],

      genres: [
        'Alternative Rock',
        'Classic Rock',
        'Gothic Rock',
        'Indie Rock',
        'Industrial Rock',
        'Instrumental Virtuoso',
        'Pop Rock',
        'Post-rock',
        'Progressive Rock',
        'Stoner Rock',
      ],
    },

    'Metal': {
      // violet
      colorRange: ['#88419d', '#9ebcda'],

      genres: [
        'Black Metal',
        'Death Metal',
        'Deathcore',
        'Doom Metal',
        'Gothic Metal',
        'Groove Metal',
        'Heavy Metal',
        'Industrial Metal',
        'Melodic Black Metal',
        'Melodic Death Metal',
        'Metalcore',
        'Nu Metal',
        'Post-black',
        'Power Metal',
        'Progressive Death Metal',
        'Progressive Metal',
        'Sludge Metal',
        'Symphonic Metal',
        'Thrash Metal',
      ],
    },

    'Punk': {
      // pink
      colorRange: ['#ce1256', '#c994c7'],

      genres: [
        'Emo',
        'Grunge',
        'Hardcore',
        'Post-hardcore',
        'Post-punk',
        'Proto-punk',
        'Punk Rock',
        'Screamo',
        'Ska Punk',
        'Ska',
      ],
    },
  },
};
