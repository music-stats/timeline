import html from '../lib/html';
import config from '../config';

import './ExternalLinks.css';

export default class ExternalLinks {
  render() {
    const {links: {github, twitter}} = config;

    return html`
      <aside
        class="ExternalLinks list-box"
      >
        <p
          class="list-box__field"
        >
          GitHub: <a href=${github.url}>${github.text}</a>
        </p>

        <p
          class="list-box__field"
        >
          Twitter: <a href=${twitter.url}>${twitter.text}</a>
        </p>
      </aside>
    `;
  }
}
