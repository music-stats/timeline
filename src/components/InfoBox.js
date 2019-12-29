import html from '../lib/html';

import config from '../config';
import {url} from '../utils/string';

import './InfoBox.css';

export default class InfoBox {
  constructor(props) {
    this.props = props;

    this.introMessageElementList = null;
    this.dateElement = null;
    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;
  }

  initializeElements() {
    this.introMessageElementList = document.querySelectorAll('.InfoBox__field--intro-message');
    this.dateElement = document.getElementById('info-box-field-date');
    this.artistNameElement = document.getElementById('info-box-field-artist-name');
    this.albumNameElement = document.getElementById('info-box-field-album-name');
    this.trackNameElement = document.getElementById('info-box-field-track-name');
  }

  showIntroMessage() {
    this.introMessageElementList.forEach((element) => element.style.display = 'block');

    [
      this.dateElement,
      this.artistNameElement,
      this.albumNameElement,
      this.trackNameElement,
    ].forEach((element) => element.innerText = '');
  }

  hideIntroMessage() {
    this.introMessageElementList.forEach((element) => element.style.display = 'none');
  }

  getLastfmLinks() {
    const {links} = config;
    const {
      dates: {
        firstScrobbleDate,
        lastScrobbleDate,
      },
      counts: {
        artistCount,
        albumCount,
        trackCount,
        scrobbleCount,
      },
    } = this.props;
    const baseUrl = `${links.lastfm.url}library`;
    const queryString = `from=${firstScrobbleDate}&to=${lastScrobbleDate}`;

    return {
      scrobbleListLink: html`
        <a href="${baseUrl}?${queryString}">${scrobbleCount}</a>
      `,
      artistListLink: html`
        <a href="${baseUrl}/artists?${queryString}">${artistCount}</a>
      `,
      albumListLink: html`
        <a href="${baseUrl}/albums?${queryString}">${albumCount}</a>
      `,
      trackListLink: html`
        <a href="${baseUrl}/tracks?${queryString}">${trackCount}</a>
      `,
    };
  }

  renderScrobbleInfo({scrobble, totals}) {
    const {date, artist, album, track} = scrobble;
    const [artistTotalPlaycount, albumTotalPlaycount, trackTotalPlaycount] = totals;

    const artistUrl = url`https://www.last.fm/music/${artist.name}`;
    const albumUrl = url`https://www.last.fm/music/${artist.name}/${album.name}`;
    const trackUrl = url`https://www.last.fm/music/${artist.name}/_/${track.name}`;

    this.dateElement.innerText = date;

    this.artistNameElement.innerHTML = html`
      <span>
        <a href=${artistUrl}>${artist.name}</a> <small>(${artist.playcount}/${artistTotalPlaycount})</small> ${artist.genre && `[${artist.genre}]`}
      </span>
    `;

    this.albumNameElement.style.display = album.name
      ? 'block'
      : 'none';

    this.albumNameElement.innerHTML = album.name
      ? html`
        <span>
          <a href=${albumUrl}>${album.name}</a> <small>(${album.playcount}/${albumTotalPlaycount})</small>
        </span>
      `
      : '';

    this.trackNameElement.innerHTML = html`
      <span>
        <a href=${trackUrl}>${track.name}</a> <small>(${track.playcount}/${trackTotalPlaycount})</small>
      </span>
    `;
  }

  afterRender() {
    this.initializeElements();
  }

  render() {
    const {links} = config;
    const {
      dates: {
        firstScrobbleDate,
        lastScrobbleDate,
      },
      counts: {
        dayCount,
        perDayCount,
      },
    } = this.props;
    const {
      scrobbleListLink,
      artistListLink,
      albumListLink,
      trackListLink,
    } = this.getLastfmLinks();

    return html`
      <aside
        class="InfoBox"
      >
        <p
          class="InfoBox__field InfoBox__field--intro-message"
        >
          <a href=${links.github.url}>${links.github.text}</a> <a href=${links.twitter.url}>${links.twitter.text}</a>
        </p>

        <p
          class="InfoBox__field InfoBox__field--intro-message"
        >
          ${dayCount} days: ${firstScrobbleDate} - ${lastScrobbleDate}
        </p>

        <p
          class="InfoBox__field InfoBox__field--intro-message"
        >
          ${scrobbleListLink} scrobbles (${perDayCount} per day)
        </p>

        <p
          class="InfoBox__field InfoBox__field--intro-message"
        >
          ${artistListLink} artists, ${albumListLink} albums, ${trackListLink} tracks
        </p>

        <p
          class="InfoBox__field InfoBox__field--intro-message"
        >
          (use arrow keys for navigation and scroll for zooming)
        </p>

        <p
          id="info-box-field-date"
          class="InfoBox__field"
        />

        <p
          id="info-box-field-artist-name"
          class="InfoBox__field"
        />

        <p
          id="info-box-field-album-name"
          class="InfoBox__field"
        />

        <p
          id="info-box-field-track-name"
          class="InfoBox__field"
        />
      </aside>
    `;
  }
}
