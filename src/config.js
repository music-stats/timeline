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
    plot: {
      padding: 20,
      backgroundColor: cssColors.darkGreyBlue,
    },

    point: {
      size: 4,
      maxMargin: 2,
      selectedColor: cssColors.white,
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
    // grey - pop
    "Singer-songwriter":       ['#525252', '#737373'],
    "Pop":                     ['#525252', '#737373'],

    // brown - electronic
    "Electronic":              ['#cc4c02', '#ec7014'],
    "Ambient":                 ['#cc4c02', '#ec7014'],
    "Darkwave":                ['#cc4c02', '#ec7014'],
    "Industrial":              ['#cc4c02', '#ec7014'],
    "Trip Hop":                ['#cc4c02', '#ec7014'],

    // red - classical
    "Classical":               ['#cb181d', '#ef3b2c'],

    // yellow - jazz
    "Jazz":                    ['#fec44f', '#fee391'],
    "Funk":                    ['#fec44f', '#fee391'],
    "Hip-hop":                 ['#fec44f', '#fee391'],

    // green - folk
    "Folk":                    ['#238b45', '#41ab5d'],
    "Bluegrass":               ['#238b45', '#41ab5d'],
    "Folk Rock":               ['#238b45', '#41ab5d'],
    "Folk Metal":              ['#238b45', '#41ab5d'],

    // blue - rock
    "Classic Rock":            ['#2171b5', '#4292c6'],
    "Alternative Rock":        ['#2171b5', '#4292c6'],
    "Gothic Rock":             ['#2171b5', '#4292c6'],
    "Grunge":                  ['#2171b5', '#4292c6'],
    "Indie Rock":              ['#2171b5', '#4292c6'],
    "Post-rock":               ['#2171b5', '#4292c6'],
    "Progressive Rock":        ['#2171b5', '#4292c6'],
    "Stoner Rock":             ['#2171b5', '#4292c6'],

    // violet - metal
    "Black Metal":             ['#88419d', '#8c6bb1'],
    "Post-black":              ['#88419d', '#8c6bb1'],
    "Heavy Metal":             ['#88419d', '#8c6bb1'],
    "Power Metal":             ['#88419d', '#8c6bb1'],
    "Symphonic Metal":         ['#88419d', '#8c6bb1'],
    "Progressive Metal":       ['#88419d', '#8c6bb1'],
    "Gothic Metal":            ['#88419d', '#8c6bb1'],
    "Thrash Metal":            ['#88419d', '#8c6bb1'],
    "Groove Metal":            ['#88419d', '#8c6bb1'],
    "Doom Metal":              ['#88419d', '#8c6bb1'],
    "Death Metal":             ['#88419d', '#8c6bb1'],
    "Melodic Death Metal":     ['#88419d', '#8c6bb1'],
    "Progressive Death Metal": ['#88419d', '#8c6bb1'],
    "Neue Deutsche Härte":     ['#88419d', '#8c6bb1'],
    "Nu Metal":                ['#88419d', '#8c6bb1'],
    "Metalcore":               ['#88419d', '#8c6bb1'],
    "Deathcore":               ['#88419d', '#8c6bb1'],
    "Screamo":                 ['#88419d', '#8c6bb1'],
    "Sludge Metal":            ['#88419d', '#8c6bb1'],

    // pink - punk
    "Punk":                    ['#ce1256', '#e7298a'],
    "Punk Rock":               ['#ce1256', '#e7298a'],
    "Ska Punk":                ['#ce1256', '#e7298a'],
    "Post-punk":               ['#ce1256', '#e7298a'],
    "Hardcore":                ['#ce1256', '#e7298a'],
  },
};
