import { createRender } from 'endr';

import Root from '#src/components/root.js';

const { document } = globalThis;

const render = createRender(
  /** @type {HTMLDivElement} */ (document.getElementById('root'))
);

export default () => render(<Root />);
