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
    this.highlightedGenreIndex = null;

    this.setGenreElementsHeight = this.setGenreElementsHeight.bind(this);
  }

  initializeElements() {
    this.element = document.getElementById('legend');
    this.genreElementCollection = this.element.getElementsByClassName('Legend__genre');
  }

  // @todo: add interactivity
  subscribe() {}

  highlightGenre(genre) {
    const genreIndex = this.genreList.findIndex(({name}) => name === genre);
    const genreElement = this.genreElementCollection[genreIndex];
    const {highlightedColor} = this.genreList[genreIndex];

    genreElement.classList.add('Legend__genre--highlight');
    genreElement.style.backgroundColor = highlightedColor;
    this.highlightedGenreIndex = genreIndex;
  }

  removeGenreHighlight() {
    if (this.highlightedGenreIndex !== null) {
      const genreElement = this.genreElementCollection[this.highlightedGenreIndex];
      const {color} = this.genreList[this.highlightedGenreIndex];

      genreElement.classList.remove('Legend__genre--highlight');
      genreElement.style.backgroundColor = color;
      this.highlightedGenreIndex = null;
    }
  }

  getGenreSortedList() {
    const {timeline: {point: {colorValueFactors, highlightedColorValueFactors}}, genreGroups} = config;
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
      const baseColor = genreGroups[genreGroup].colorRange[0];
      const color = d3Color.hsl(baseColor);
      const highlightedColor = d3Color.hsl(baseColor);

      color.s *= colorValueFactors.saturation;
      color.l *= colorValueFactors.lightness;

      highlightedColor.s *= highlightedColorValueFactors.saturation;
      highlightedColor.l *= highlightedColorValueFactors.lightness;

      genreList.push({
        name: genre,
        artistCount,
        playcount,
        color,
        highlightedColor,
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
    for (let i = 0; i < this.genreElementCollection.length; i += 1) {
      const {playcount} = this.genreList[i];
      const height = Math.max(this.heightScale(playcount), 1);
      const genreElement = this.genreElementCollection[i];

      genreElement.style.height = `${height}px`;
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
