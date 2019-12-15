import config from './config';
import Timeline from './containers/Timeline';

import './app.css';
import './app-theme.css';

fetch(config.dataUrl)
  .then((data) => data.json())
  .then((scrobbleList) => {
    const timeline = new Timeline({
      scrobbleList,
    });

    timeline.beforeRender();
    document.body.innerHTML = timeline.render();
    timeline.afterRender();
    timeline.draw();
  });
