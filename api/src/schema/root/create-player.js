import bcrypt from 'bcrypt';

import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      emailAddress: 'email',
      name: { type: 'string', typeArgs: { maxLength: 50 } },
      password: { type: 'string', typeArgs: { minLength: 8 } }
    }
  },
  resolve: async ({
    context: { load },
    input: { emailAddress, name, password }
  }) => {
    const id = createId();
    try {
      await load.tx
        .insert({
          id,
          emailAddress,
          name,
          passwordHash: await bcrypt.hash(password, 10),
          isAdmin: false,
          isActive: true
        })
        .into('players');
    } catch (er) {
      if (
        er.message.contains(
          'duplicate key value violates unique constraint "players_emailaddress_unique"'
        )
      ) {
        throw new PublicError('This email address is already in use');
      }
    }

    return { createdPlayer: { id } };
  }
};
