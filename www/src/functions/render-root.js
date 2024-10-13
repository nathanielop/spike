import { render } from 'endr';

import Root from '#src/components/root.js';

const { document } = globalThis;

export default () => {
  render(<Root />, document.getElementById('root'));
};
