import Router, {parse} from 'micro-conductor';

import config from './config';
import getSummary from './dataset/summary';
import {insertGenres} from './dataset/genre';
import {insertColors} from './dataset/color';
import {dateTimeStringToTimestamp} from './utils/date';

import Timeline from './containers/Timeline';
import TimelineInteractive from './containers/TimelineInteractive';

import './app.css';
import './app-theme.css';

const cache = {};

function retrieveAll(urlList) {
  return Promise.all(urlList.map(retrieve));
}

function retrieve(url) {
  if (cache[url]) {
    return Promise.resolve(cache[url]);
  }

  return fetch(url)
    .then((response) => response.json())
    .then((data) => cache[url] = data);
}

function transform([yearList, scrobbleListOriginal, artistsByGenres]) {
  const scrobbleList = scrobbleListOriginal.map((scrobble, index) => ({
    ...scrobble,
    index,
    timestamp: dateTimeStringToTimestamp(scrobble.date),
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

  timeline.beforeRender();
  document.body.innerHTML = timeline.render();
  timeline.afterRender();
  timeline.draw();

  // for debugging only
  // window.timeline = timeline;

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
  [parse`${/\d{4}/}`]: createTimeline,
});

router.start();
