import bcrypt from 'bcrypt';

import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      emailAddress: 'email',
      name: { type: 'string', typeInput: { maxLength: 50 } },
      password: { type: 'string', typeInput: { minLength: 8 } }
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
          elo: 250,
          credits: 1000,
          points: 0,
          emailAddress,
          name,
          passwordHash: await bcrypt.hash(password, 10),
          isAdmin: false,
          isSuperAdmin: false,
          isActive: true,
          createdAt: new Date()
        })
        .into('players');
    } catch (er) {
      if (
        er.message.includes(
          'duplicate key value violates unique constraint "players_name_unique"'
        )
      ) {
        throw new PublicError('This name is already in use');
      }

      if (
        er.message.includes(
          'duplicate key value violates unique constraint "players_emailaddress_unique"'
        )
      ) {
        throw new PublicError('This email address is already in use');
      }

      throw er;
    }

    return { createdPlayer: { id } };
  }
};
