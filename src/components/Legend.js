import * as d3Scale from 'd3-scale';
import html from '../lib/html';

import config from '../config';
import {getGenreSortedList} from '../utils/dataset';

import './Legend.css';

export default class Legend {
  constructor(props) {
    this.props = props;
    this.element = null;
    this.genreElementCollection = [];
    this.genreList = getGenreSortedList(props.scrobbleList);
    this.heightScale = this.getHeightScale();

    this.setGenreElementsHeight = this.setGenreElementsHeight.bind(this);
  }

  initializeElements() {
    this.element = document.getElementById('legend');
    this.genreElementCollection = this.element.getElementsByClassName('Legend__genre');
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
    requestAnimationFrame(this.setGenreElementsHeight);
  }

  setGenreElementsHeight() {
    for (let i = 0; i < this.genreElementCollection.length; i += 1) {
      const genreElement = this.genreElementCollection[i];
      const {playcount} = this.genreList[i];
      const height = Math.max(this.heightScale(playcount), 1);

      genreElement.style.height = `${height}px`;
    }
  }

  renderGenre({name, artistCount, playcount, color}) {
    const {scrobbleList} = this.props;
    const title = [
      `${artistCount} artist${artistCount > 1 ? 's' : ''}`,
      `${playcount} scrobble${playcount > 1 ? 's' : ''} (${(100 * playcount / scrobbleList.length).toFixed(1)}%)`,
    ].join(', ');

    return html`
      <section
        class="Legend__genre"
        style="background-color: ${color}"
        title=${title}
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
