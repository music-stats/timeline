import Timeline from './components/timeline/Timeline';

import './app.css';
import './app-theme.css';

function retrieve(url) {
  return fetch(url)
    .then((data) => data.json());
}

function initialize(scrobbleList) {
  const timeline = new Timeline({
    scrobbleList,
  });

  document.body.innerHTML = timeline.render();
}

retrieve('data/scrobbles.json')
  .then(initialize);
