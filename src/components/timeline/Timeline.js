import * as d3Scale from 'd3-scale';
import html from '../../lib/html';

import {dateStringToTimestamp} from '../../utils/date';

import './Timeline.css';

export default class Timeline {
  static getDefaultProps() {
    return {
      size: 100,
      timeAxisPosition: 90,
      scrobbleSize: 1,
    };
  }

  constructor(props) {
    this.props = {
      ...this.constructor.getDefaultProps(),
      ...props,
    };

    const {scrobbleList, size, timeAxisPosition} = this.props;
    const artistPlaycountList = scrobbleList.map(({artist}) => artist.playcount);

    this.timeRangeScale = d3Scale.scaleLinear()
      .domain([
        dateStringToTimestamp(scrobbleList[0].date),
        dateStringToTimestamp(scrobbleList[scrobbleList.length - 1].date),
      ])
      .range([size - timeAxisPosition, timeAxisPosition]);

    this.artistPlaycountScale = d3Scale.scaleLinear()
      .domain([
        Math.max(...artistPlaycountList),
        Math.min(...artistPlaycountList),
      ])
      .range([size - timeAxisPosition, timeAxisPosition]);
  }

  renderScrobble({date, track, album, artist}) {
    const {scrobbleSize} = this.props;
    const scrobbleOffset = scrobbleSize / 2;

    return html`
      <rect
        class="Timeline__scrobble"
        x=${this.timeRangeScale(dateStringToTimestamp(date)) - scrobbleOffset}
        y=${this.artistPlaycountScale(artist.playcount) - scrobbleOffset}
        width=${scrobbleSize} height=${scrobbleSize}
        rx="0.2"
        title=${`${artist.name} - ${album.name} - ${track.name}`}
      />
    `;
  }

  render() {
    const {scrobbleList, size, timeAxisPosition} = this.props;

    return html`
      <main
        class="Timeline"
      >
        <svg
          class="Timeline__chart"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 ${size} ${size}"
        >
          <g
            fill="var(--color-dark-grey-2)"
          >
            ${scrobbleList.map(this.renderScrobble, this)}
          </g>

          <line
            x1=${size - timeAxisPosition} y1=${timeAxisPosition}
            x2=${timeAxisPosition} y2=${timeAxisPosition}
            stroke-width="0.5"
            stroke="var(--color-grey)"
          />
        </svg>
      </main>
    `;
  }
}
