import { render } from 'endr';

import App from '#src/components/app.js';

const { document } = globalThis;

export default () => {
  render(<App />, document.getElementById('root'));
}
