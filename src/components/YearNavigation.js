import classNames from 'classnames';
import html from '../lib/html';

import './YearNavigation.css';

export default class YearNavigation {
  constructor(props) {
    this.props = props;
  }

  renderYearLink(year) {
    const {currentYear} = this.props;

    return html`
      <a
        class=${classNames(
          'YearNavigation__year-link',
          {
            'YearNavigation__year-link--current': currentYear === year,
          },
        )}
        href="#${year}"
      >
        ${year}
      </a>
    `;
  }

  render() {
    const {yearList} = this.props;

    return html`
      <nav
        class="YearNavigation list-box--with-bg"
      >
        ${yearList.map(this.renderYearLink, this)}
      </nav>
    `;
  }
}
