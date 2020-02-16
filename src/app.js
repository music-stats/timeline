import Router, {parse} from 'micro-conductor';

import config from './config';
import getSummary from './dataset/summary';
import {insertGenres} from './dataset/genre';
import {insertColors} from './dataset/color';
import {uncompress} from './dataset/scrobble';
import {dateTimeStringToTimestamp} from './utils/date';

import Timeline from './containers/Timeline';
import TimelineInteractive from './containers/TimelineInteractive';

import './app.css';
import './app-theme.css';

const dataCache = {};
let currentTimeline = null;

function retrieveAll(urlList) {
  return Promise.all(urlList.map(retrieve));
}

function retrieve(url) {
  if (dataCache[url]) {
    return Promise.resolve(dataCache[url]);
  }

  return fetch(url)
    .then((response) => response.json())
    .then((data) => dataCache[url] = data);
}

function transform([yearList, scrobbleListOriginal, artistsByGenres]) {
  const scrobbleList = scrobbleListOriginal.map((compressedScrobble, index) => ({
    ...uncompress(compressedScrobble),
    index,
    timestamp: dateTimeStringToTimestamp(compressedScrobble[0]),
  }));
  const summary = getSummary(scrobbleList);

  return {
    yearList,
    summary,
    scrobbleList: insertColors(
      insertGenres(scrobbleList, artistsByGenres),
      summary.maxAlbumPlaycount,
    ),
  };
}

function render(props) {
  const timeline = new TimelineInteractive(props, new Timeline(props));

  if (currentTimeline) {
    currentTimeline.unsubscribe();
  }

  timeline.beforeRender();
  document.body.innerHTML = timeline.render();
  timeline.afterRender();
  timeline.draw();

  currentTimeline = timeline;

  return timeline;
}

function createTimeline(year) {
  retrieveAll([
    config.dataUrls.yearList,
    `${config.dataUrls.yearsBase}/${year}.json`,
    config.dataUrls.artistsByGenres,
  ])
    .then(transform)
    .then(render);
}

const router = new Router({
  '': () => document.location.hash = config.defaultDataYear,
  'all': createTimeline,
  [parse`${/\d{4}/}`]: createTimeline,
});

router.start();
