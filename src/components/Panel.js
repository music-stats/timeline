import classNames from 'classnames';
import html from '../lib/html';

import './Panel.css';

export default class Panel {
  constructor(props) {
    this.props = props;
  }

  afterRender() {
    Object.values(this.props.children).forEach((child) => {
      if (typeof child.afterRender === 'function') {
        child.afterRender();
      }
    });
  }

  render() {
    const {position, children} = this.props;

    return html`
      <aside
        class="${classNames('Panel', `Panel--${position}`)}"
      >
        ${Object.values(children).map((child) => child.render())}
      </aside>
    `;
  }
}
