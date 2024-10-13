import crypto from 'node:crypto';

export default {
  type: { nullable: 'url' },
  resolve: async ({ object: { id }, context: { load } }) => {
    const player = await load('players', id);
    const trimmedEmail = player.emailAddress.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(trimmedEmail).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=80&d=blank`;
  }
};
