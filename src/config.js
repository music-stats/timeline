import cssColors from './app-theme';

export default {
  dataUrl: 'data/scrobbles.json',

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
};
