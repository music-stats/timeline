import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-color';
import html from '../lib/html';

import config from '../config';

import './Legend.css';

export default class Legend {
  constructor(props) {
    this.props = props;
    this.element = null;
    this.genreList = this.getGenreSortedList();
    this.heightScale = this.getHeightScale();

    this.setGenreElementsHeight = this.setGenreElementsHeight.bind(this);
  }

  initializeElements() {
    this.element = document.getElementById('legend');
  }

  // @todo: add interactivity
  subscribe() {}

  getGenreSortedList() {
    const {timeline: {point: {colorValueFactors}}, genreGroups} = config;
    const {scrobbleList} = this.props;

    const genres = {};
    const genreList = [];
    const artistPlaycounts = {};

    scrobbleList.forEach(({artist: {name, playcount, genreGroup, genre}}) => {
      if (!genre) {
        return;
      }

      let genreRecord = genres[genre];
      if (!genreRecord) {
        genreRecord = {
          genreGroup,
          artistCount: 0,
          playcount: 0,
        };
        genres[genre] = genreRecord;
      }

      if (artistPlaycounts[name]) {
        genreRecord.playcount = genreRecord.playcount - artistPlaycounts[name] + playcount;
      } else {
        genreRecord.artistCount += 1;
        genreRecord.playcount += playcount;
      }

      artistPlaycounts[name] = playcount;
    });

    for (const genre in genres) {
      const {artistCount, playcount, genreGroup} = genres[genre];
      const color = d3Color.hsl(genreGroups[genreGroup].colorRange[0]);

      color.s *= colorValueFactors.saturation;
      color.l *= colorValueFactors.lightness;

      genreList.push({
        name: genre,
        artistCount,
        playcount,
        color,
      });
    }

    return genreList.sort((a, b) => b.playcount - a.playcount);
  }

  getHeightScale() {
    const {timeline: {legend: {height}}} = config;
    const maxPlaycount = Math.max(...this.genreList.map(({playcount}) => playcount));

    return d3Scale.scaleLinear()
      .domain([0, maxPlaycount])
      .range([0, height]);
  }

  afterRender() {
    this.initializeElements();
    this.subscribe();
    requestAnimationFrame(this.setGenreElementsHeight);
  }

  setGenreElementsHeight() {
    const genreElementCollection = this.element.getElementsByClassName('Legend__genre');

    for (let i = 0; i < genreElementCollection.length; i += 1) {
      const {playcount} = this.genreList[i];
      const height = Math.max(this.heightScale(playcount), 1);

      genreElementCollection[i].style.height = `${height}px`;
    }
  }

  renderGenre({name, artistCount, playcount, color}) {
    return html`
      <section
        class="Legend__genre"
        style="background-color: ${color}"
        title="${artistCount} artist${artistCount > 1 ? 's' : ''}, ${playcount} scrobble${playcount > 1 ? 's' : ''}"
      >
        <span
          class="Legend__genre-caption"
        >
          ${name}
        </span>
      </section>
    `;
  }

  render() {
    return html`
      <nav
        id="legend"
        class="Legend"
      >
        ${this.genreList.map(this.renderGenre, this)}
      </nav>
    `;
  }
}
