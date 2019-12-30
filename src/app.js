import config from './config';
import {enrichScrobbleList} from './utils/dataset';
import Timeline from './containers/Timeline';

import './app.css';
import './app-theme.css';

Promise.all([
  config.dataUrls.scrobbles,
  config.dataUrls.artistsByGenres,
].map((url) => fetch(url).then((response) => response.json())))
  .then(([scrobbleListOriginal, artistsByGenres]) => {
    const scrobbleList = enrichScrobbleList(scrobbleListOriginal, artistsByGenres);
    const timeline = new Timeline({
      scrobbleList,
      artistsByGenres,
    });

    timeline.beforeRender();
    document.body.innerHTML = timeline.render();
    timeline.afterRender();
    timeline.draw();

    // for debug only
    // window.timeline = timeline;
  });
