import { customAlphabet } from 'nanoid';

import config from '#src/config.js';

const { alphabet, size } = config.ids;

const nanoid = customAlphabet(alphabet, size);

export default len => nanoid(len);
