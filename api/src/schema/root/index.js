import jwt from 'jsonwebtoken';

import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';
import createGame from '#src/schema/root/create-game.js';
import createGrant from '#src/schema/root/create-grant.js';
import createPlayer from '#src/schema/root/create-player.js';
import createSeriesAndGame from '#src/schema/root/create-series-and-game.js';
import deleteGrant from '#src/schema/root/delete-grant.js';
import player from '#src/schema/root/player.js';
import players from '#src/schema/root/players.js';
import updateGame from '#src/schema/root/update-game.js';

const { sharedKey } = config.jtspike;

export default {
  defaultValue: {},
  type: {
    object: {
      createdGame: { nullable: 'game' },
      createdGrant: { nullable: 'grant' },
      createdPlayer: { nullable: 'player' },
      createdSeries: { nullable: 'series' },
      createGame,
      createGrant,
      createPlayer,
      createSeriesAndGame,
      deleteGrant,
      players,
      player,
      updateGame
    }
  },
  input: {
    object: {
      grantKey: { nullable: 'string' }
    },
    defaultValue: {}
  },
  resolve: async ({ input: { grantKey }, path, value, context }) => {
    // Clear load cache for nested queries
    // (necessary for processing updates & requerying loaded information)
    if (path.length > 0) context.load.clear();

    if (grantKey) {
      try {
        const token = jwt.verify(grantKey, sharedKey);
        const grant = await context.load('grants', token.data.id);
        const player = await context.load('players', grant.player.id);
        context.grant = grant;
        context.player = player;
      } catch (er) {
        throw new PublicError('Invalid grant key provided');
      }
    }

    return value;
  }
};
