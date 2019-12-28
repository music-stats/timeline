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
    zoom: {
      min: 1,
      max: 10,
      deltaFactor: 0.02,
    },

    plot: {
      padding: 20,
      backgroundColor: cssColors.darkGreyBlue,
    },

    point: {
      size: 4,
      maxMargin: 2,
      selectedColor: cssColors.white,
      colorValueFactors: {
        saturation: 0.5,
        lightness: 0.8,
      },
      highlightedColorValueFactors: {
        saturation: 1.2,
        lightness: 1.8,
      },
    },

    timeAxis: {
      width: 2,
      color: cssColors.grey1,
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

  genreColors: {
    // brown - electronic
    "Electronic":              ['#cc4c02', '#fec44f'],
    "Ambient":                 ['#cc4c02', '#fec44f'],
    "Darkwave":                ['#cc4c02', '#fec44f'],
    "Industrial":              ['#cc4c02', '#fec44f'],
    "Trip Hop":                ['#cc4c02', '#fec44f'],
    "Dream Pop":               ['#cc4c02', '#fec44f'],

    // red - classical
    "Classical":               ['#cb181d', '#fc9272'],

    // yellow - jazzy
    "Cabaret":                 ['#fec44f', '#fff7bc'],
    "Jazz":                    ['#fec44f', '#fff7bc'],
    "Funk":                    ['#fec44f', '#fff7bc'],
    "Hip-hop":                 ['#fec44f', '#fff7bc'],

    // green - folk
    "Folk":                    ['#238b45', '#a1d99b'],
    "Bluegrass":               ['#238b45', '#a1d99b'],
    "Folk Rock":               ['#238b45', '#a1d99b'],
    "Folk Metal":              ['#238b45', '#a1d99b'],
    "Dark Folk":               ['#238b45', '#a1d99b'],

    // green-blue - pop
    "Singer-songwriter":       ['#02818a', '#a6bddb'],
    "Pop":                     ['#02818a', '#a6bddb'],

    // blue - rock
    "Rockabilly":              ['#2171b5', '#9ecae1'],
    "Classic Rock":            ['#2171b5', '#9ecae1'],
    "Alternative Rock":        ['#2171b5', '#9ecae1'],
    "Gothic Rock":             ['#2171b5', '#9ecae1'],
    "Grunge":                  ['#2171b5', '#9ecae1'],
    "Indie Rock":              ['#2171b5', '#9ecae1'],
    "Post-rock":               ['#2171b5', '#9ecae1'],
    "Progressive Rock":        ['#2171b5', '#9ecae1'],
    "Stoner Rock":             ['#2171b5', '#9ecae1'],
    "Industrial Rock":         ['#2171b5', '#9ecae1'],

    // violet - metal
    "Black Metal":             ['#88419d', '#9ebcda'],
    "Post-black":              ['#88419d', '#9ebcda'],
    "Heavy Metal":             ['#88419d', '#9ebcda'],
    "Power Metal":             ['#88419d', '#9ebcda'],
    "Symphonic Metal":         ['#88419d', '#9ebcda'],
    "Progressive Metal":       ['#88419d', '#9ebcda'],
    "Gothic Metal":            ['#88419d', '#9ebcda'],
    "Thrash Metal":            ['#88419d', '#9ebcda'],
    "Groove Metal":            ['#88419d', '#9ebcda'],
    "Doom Metal":              ['#88419d', '#9ebcda'],
    "Death Metal":             ['#88419d', '#9ebcda'],
    "Melodic Death Metal":     ['#88419d', '#9ebcda'],
    "Progressive Death Metal": ['#88419d', '#9ebcda'],
    "Industrial Metal":        ['#88419d', '#9ebcda'],
    "Neue Deutsche Härte":     ['#88419d', '#9ebcda'],
    "Nu Metal":                ['#88419d', '#9ebcda'],
    "Metalcore":               ['#88419d', '#9ebcda'],
    "Deathcore":               ['#88419d', '#9ebcda'],
    "Screamo":                 ['#88419d', '#9ebcda'],
    "Sludge Metal":            ['#88419d', '#9ebcda'],

    // pink - punk
    "Punk":                    ['#ce1256', '#c994c7'],
    "Punk Rock":               ['#ce1256', '#c994c7'],
    "Ska Punk":                ['#ce1256', '#c994c7'],
    "Post-punk":               ['#ce1256', '#c994c7'],
    "Hardcore":                ['#ce1256', '#c994c7'],
  },
};
