import html from '../../lib/html';

import {url} from '../../utils/string';

import './TimelineInfoBox.css';

export default class TimelineInfoBox {
  constructor(props) {
    this.props = props;

    this.introMessageElementList = null;
    this.dateElement = null;
    this.artistNameElement = null;
    this.albumNameElement = null;
    this.trackNameElement = null;
  }

  initializeElements() {
    this.introMessageElementList = document.querySelectorAll('.TimelineInfoBox__field--intro-message');
    this.dateElement = document.getElementById('date');
    this.artistNameElement = document.getElementById('artist-name');
    this.albumNameElement = document.getElementById('album-name');
    this.trackNameElement = document.getElementById('track-name');
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

  renderScrobbleInfo({scrobble, totals}) {
    const {date, artist, album, track} = scrobble;
    const [artistTotalPlaycount, albumTotalPlaycount, trackTotalPlaycount] = totals;

    const artistUrl = url`https://www.last.fm/music/${artist.name}`;
    const albumUrl = url`https://www.last.fm/music/${artist.name}/${album.name}`;
    const trackUrl = url`https://www.last.fm/music/${artist.name}/_/${track.name}`;

    this.dateElement.innerText = `date: ${date}`;

    this.artistNameElement.innerHTML = html`
      <span>
        artist: <a href=${artistUrl}>${artist.name}</a> <small>(${artist.playcount}/${artistTotalPlaycount})</small>
      </span>
    `;

    this.albumNameElement.innerHTML = html`
      <span>
        album: <a href=${albumUrl}>${album.name}</a> <small>(${album.playcount}/${albumTotalPlaycount})</small>
      </span>
    `;

    this.trackNameElement.innerHTML = html`
      <span>
        track: <a href=${trackUrl}>${track.name}</a> <small>(${track.playcount}/${trackTotalPlaycount})</small>
      </span>
    `;
  }

  render() {
    const {
      links,
      dates: {
        firstScrobbleDate,
        lastScrobbleDate,
      },
      counts: {
        artistCount,
        albumCount,
        trackCount,
        scrobbleCount,
        dayCount,
        perDayCount,
      },
    } = this.props;

    return html`
      <aside
        class="TimelineInfoBox"
      >
        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          Last.fm: <a href=${links.lastfm.url}>${links.lastfm.text}</a>
        </p>

        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          GitHub: <a href=${links.github.url}>${links.github.text}</a>
        </p>

        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          Twitter: <a href=${links.twitter.url}>${links.twitter.text}</a>
        </p>

        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          period: ${firstScrobbleDate} - ${lastScrobbleDate} (${dayCount} days)
        </p>

        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          total: ${[
            `${artistCount} artists`,
            `${albumCount} albums`,
            `${trackCount} tracks`,
            `${scrobbleCount} scrobbles (${perDayCount} per day)`,
          ].join(', ')}
        </p>

        <p
          class="TimelineInfoBox__field TimelineInfoBox__field--intro-message"
        >
          (hover over a scrobble and use arrow keys for navigation)
        </p>

        <p
          id="date"
          class="TimelineInfoBox__field"
        />

        <p
          id="artist-name"
          class="TimelineInfoBox__field"
        />

        <p
          id="album-name"
          class="TimelineInfoBox__field"
        />

        <p
          id="track-name"
          class="TimelineInfoBox__field"
        />
      </aside>
    `;
  }
}
