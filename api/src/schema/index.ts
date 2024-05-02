import types from 'pave-basic-types';

import player from '#src/schema/player/index.ts';
import root from '#src/schema/root/index.ts';

const { boolean, datetime, date, number, string, time } = types;

export default { boolean, datetime, date, number, player, root, string, time };
