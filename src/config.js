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
    "Alternative Rock":        ['#fde0dd', '#fcc5c0'],
    "Ambient":                 ['#ece7f2', '#d0d1e6'],
    "Black Metal":             ['#e0ecf4', '#bfd3e6'],
    "Classic Rock":            ['#fc8d59', '#ef6548'],
    "Classical":               ['#88419d', '#810f7c'],
    "Electronic":              ['#ae017e', '#7a0177'],
    "Folk Metal":              ['#006d2c', '#00441b'],
    "Folk Rock":               ['#41ae76', '#238b45'],
    "Folk":                    ['#66c2a4', '#41ae76'],
    "Funk":                    ['#fb6a4a', '#ef3b2c'],
    "Gothic Metal":            ['#54278f', '#3f007d'],
    "Gothic Rock":             ['#807dba', '#6a51a3'],
    "Groove Metal":            ['#fdbb84', '#fc8d59'],
    "Grunge":                  ['#a6bddb', '#74a9cf'],
    "Hardcore":                ['#fdd49e', '#fdbb84'],
    "Heavy Metal":             ['#fc4e2a', '#e31a1c'],
    "Hip-hop":                 ['#993404', '#662506'],
    "Indie Rock":              ['#8c6bb1', '#88419d'],
    "Industrial":              ['#fed976', '#feb24c'],
    "Jazz":                    ['#edf8b1', '#c7e9b4'],
    "Melodic Death Metal":     ['#a6bddb', '#0570b0'],
    "Metalcore":               ['#c994c7', '#e7298a'],
    "Neue Deutsche Härte":     ['#fdd0a2', '#fdae6b'],
    "Nu Metal":                ['#fa9fb5', '#f768a1'],
    "Pop":                     ['#efedf5', '#dadaeb'],
    "Post-rock":               ['#deebf7', '#c6dbef'],
    "Power Metal":             ['#e31a1c', '#bd0026'],
    "Progressive Death Metal": ['#225ea8', '#253494'],
    "Progressive Metal":       ['#1d91c0', '#225ea8'],
    "Progressive Rock":        ['#9ebcda', '#8c96c6'],
    "Punk Rock":               ['#c994c7', '#df65b0'],
    "Screamo":                 ['#ce1256', '#980043'],
    "Singer-songwriter":       ['#e0ecf4', '#bfd3e6'],
    "Ska Punk":                ['#fee391', '#fec44f'],
    "Sludge Metal":            ['#fe9929', '#ec7014'],
    "Stoner Rock":             ['#cc4c02', '#993404'],
    "Symphonic Metal":         ['#8c6bb1', '#88419d'],
    "Thrash Metal":            ['#cb181d', '#a50f15'],
    "Trip Hop":                ['#bcbddc', '#9e9ac8'],
  },
};
