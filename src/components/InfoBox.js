import html from '../lib/html';

import config from '../config';
import {dateTimeStringToDateString} from '../utils/date';
import {url} from '../utils/string';

import './InfoBox.css';

export default class InfoBox {
  constructor(props) {
    this.props = props;

    this.introMessageElementList = null;
    this.scrobbleInfoElementList = null;

    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;
  }

  initializeElements() {
    this.introMessageElementList = document.querySelectorAll('.InfoBox__field--intro-message');
    this.scrobbleInfoElementList = document.querySelectorAll('.InfoBox__field--scrobble-info');

    this.artistNameElement = document.getElementById('info-box-field-artist-name');
    this.albumNameElement = document.getElementById('info-box-field-album-name');
    this.trackNameElement = document.getElementById('info-box-field-track-name');
  }

  showIntroMessage() {
    this.introMessageElementList.forEach((element) => element.style.display = 'block');
    this.scrobbleInfoElementList.forEach((element) => element.style.display = 'none');
  }

  hideIntroMessage() {
    this.introMessageElementList.forEach((element) => element.style.display = 'none');
  }

  getLastfmLinks() {
    const {links} = config;
    const {dates, summary} = this.props;

    const baseUrl = `${links.lastfm.url}library`;
    const fromDateString = dateTimeStringToDateString(dates.firstScrobbleDate);
    const toDateString = dateTimeStringToDateString(dates.lastScrobbleDate);
    const queryString = `from=${fromDateString}&to=${toDateString}`;

    return {
      scrobbleListLink: html`
        <a href="${baseUrl}?${queryString}">${summary.scrobbleCount}</a>
      `,
      artistListLink: html`
        <a href="${baseUrl}/artists?${queryString}">${summary.artistCount}</a>
      `,
      albumListLink: html`
        <a href="${baseUrl}/albums?${queryString}">${summary.albumCount}</a>
      `,
      trackListLink: html`
        <a href="${baseUrl}/tracks?${queryString}">${summary.trackCount}</a>
      `,
    };
  }

  renderScrobbleInfo({artist, album, track}, totals) {
    const artistUrl = url`https://www.last.fm/music/${artist.name}`;
    const albumUrl = url`https://www.last.fm/music/${artist.name}/${album.name}`;
    const trackUrl = url`https://www.last.fm/music/${artist.name}/_/${track.name}`;

    this.artistNameElement.style.display = 'block';
    this.artistNameElement.innerHTML = html`
      <span>
        <a href=${artistUrl}>${artist.name}</a> <small>(${artist.playcount}/${totals.artist})</small>
      </span>
    `;

    this.albumNameElement.style.display = album.name
      ? 'block'
      : 'none';
    this.albumNameElement.innerHTML = album.name
      ? html`
        <span>
          <a href=${albumUrl}>${album.name}</a> <small>(${album.playcount}/${totals.album})</small>
        </span>
      `
      : '';

    this.trackNameElement.style.display = 'block';
    this.trackNameElement.innerHTML = html`
      <span>
        <a href=${trackUrl}>${track.name}</a> <small>(${track.playcount}/${totals.track})</small>
      </span>
    `;
  }

  afterRender() {
    this.initializeElements();
  }

  render() {
    const {summary} = this.props;
    const {
      scrobbleListLink,
      artistListLink,
      albumListLink,
      trackListLink,
    } = this.getLastfmLinks();

    return html`
      <aside
        class="InfoBox list-box list-box--with-rows list-box--with-bg"
      >
        <p
          class="InfoBox__field--intro-message list-box__field"
        >
          ${scrobbleListLink} scrobbles (${summary.scrobblePerDayCount} per day)
        </p>

        <p
          class="InfoBox__field--intro-message list-box__field"
        >
          ${artistListLink} artists, ${albumListLink} albums, ${trackListLink} tracks
        </p>

        <p
          id="info-box-field-artist-name"
          class="InfoBox__field--scrobble-info list-box__field"
        />

        <p
          id="info-box-field-album-name"
          class="InfoBox__field--scrobble-info list-box__field"
        />

        <p
          id="info-box-field-track-name"
          class="InfoBox__field--scrobble-info list-box__field"
        />
      </aside>
    `;
  }
}
