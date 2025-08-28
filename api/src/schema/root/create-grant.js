import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

const {
  jtspike: { sharedKey }
} = config;

export default {
  type: 'root',
  input: {
    object: {
      emailAddress: 'email',
      password: { type: 'string', typeInput: { minLength: 8 } }
    }
  },
  resolve: async ({ context, input: { emailAddress, password } }) => {
    const [player] = await context.load.tx
      .select('*')
      .from('players')
      .where({ emailAddress });

    if (
      !player ||
      (password && !(await bcrypt.compare(password, player.passwordHash)))
    ) {
      throw new PublicError(
        'The email address or password does not match our records.'
      );
    }

    const id = createId();
    const [currentGrant] = await context.load.tx
      .insert({
        id,
        secret: jwt.sign(
          { data: { id, player: { ...player, passwordHash: undefined } } },
          sharedKey,
          { expiresIn: 604800000 }
        ),
        playerId: player.id,
        createdAt: new Date()
      })
      .into('grants')
      .returning('*');

    context.grant = currentGrant;

    return { createdGrant: { id } };
  }
};
