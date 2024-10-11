import { render } from 'endr';

import App from '#src/components/app.js';

const { document } = globalThis;

render(<App />, document.getElementById('root'));
