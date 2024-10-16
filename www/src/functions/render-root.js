import { createRoot } from 'endr';

import Root from '#src/components/root.js';

const { document } = globalThis;

export default () => {
  createRoot(document.getElementById('root')).render(<Root />);
};
