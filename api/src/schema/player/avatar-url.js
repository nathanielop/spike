import crypto from 'node:crypto';

export default {
  input: {
    object: {
      size: {
        type: 'integer',
        typeArgs: { min: 80, max: 200 },
        defaultValue: 80
      }
    },
    defaultValue: {}
  },
  type: { nullable: 'url' },
  resolve: async ({ input: { size }, object: { id }, context: { load } }) => {
    const player = await load('players', id);
    const trimmedEmail = player.emailAddress.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=blank`;
  }
};
