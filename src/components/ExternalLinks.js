import html from '../lib/html';
import config from '../config';

import './ExternalLinks.css';

export default class ExternalLinks {
  render() {
    const {links: {github, twitter}} = config;

    return html`
      <aside
        class="ExternalLinks list-box list-box--with-rows list-box--with-bg"
      >
        <p
          class="ExternalLinks__field list-box__field"
        >
          <a
            class="ExternalLinks__link"
            href=${twitter.url}
          >
            ${twitter.text}
          </a>
        </p>

        <p
          class="ExternalLinks__field list-box__field"
        >
          <a
            class="ExternalLinks__link"
            href=${github.url}
          >
            ${github.text}
          </a>
        </p>

        <p
          class="ExternalLinks__field list-box__field"
        >
          <a
            class="ExternalLinks__link ExternalLinks__link--grid"
            href="https://supportukrainenow.org/"
          >
            <span>#StandWithUkraine<//>

            <img
              class="ExternalLinks__flag"
              src="flag-ua-1x1.svg" alt="Flag of Ukraine"
            />
          </a>
        </p>
      </aside>
    `;
  }
}
