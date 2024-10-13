import bcrypt from 'bcrypt';

import PublicError from '#src/constants/public-error.js';
import maybeUpdate from '#src/functions/maybe-update.js';

export default {
  type: 'root',
  input: {
    object: {
      id: 'id',
      nickname: { optional: { nullable: 'string' } },
      name: { optional: { nullable: 'string' } },
      password: { optional: { nullable: 'string' } }
    }
  },
  resolve: async ({
    input: { id, nickname, name, password },
    context,
    context: { load }
  }) => {
    const player = await load('players', id);
    if (!player || context.player?.id !== player.id) {
      throw new PublicError("You don't have permission to update this player");
    }

    const update = {};
    maybeUpdate(update, player, { nickname, name });

    if (password && !(await bcrypt.compare(password, player.passwordHash))) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(update).length) {
      await load.tx.table('players').update(update).where({ id });
    }
  }
};
