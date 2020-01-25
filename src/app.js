import config from './config';

import getSummary from './dataset/summary';
import {insertGenres} from './dataset/genre';
import {insertColors} from './dataset/color';
import {dateTimeStringToTimestamp} from './utils/date';

import Timeline from './containers/Timeline';
import TimelineInteractive from './containers/TimelineInteractive';

import './app.css';
import './app-theme.css';

function retrieveAll(urlList) {
  return Promise.all(urlList.map(retrieve));
}

function retrieve(url) {
  return fetch(url)
    .then((response) => response.json());
}

function transform([scrobbleListOriginal, artistsByGenres]) {
  const scrobbleList = scrobbleListOriginal.map((scrobble, index) => ({
    ...scrobble,
    index,
    timestamp: dateTimeStringToTimestamp(scrobble.date),
  }));
  const summary = getSummary(scrobbleList);

  return {
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

  return timeline;
}

function debug(timeline) {
  let toDebug = false;
  // toDebug = true;

  if (toDebug) {
    window.timeline = timeline;
  }
}

retrieveAll([
  config.dataUrls.scrobbles,
  config.dataUrls.artistsByGenres,
])
  .then(transform)
  .then(render)
  .then(debug);
