import jwt from 'jsonwebtoken';

import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';
import claimDailyReward from '#src/schema/root/claim-daily-reward.js';
import completeGame from '#src/schema/root/complete-game.js';
import createBet from '#src/schema/root/create-bet.js';
import createBounty from '#src/schema/root/create-bounty.js';
import createGame from '#src/schema/root/create-game.js';
import createGrant from '#src/schema/root/create-grant.js';
import createItemPurchase from '#src/schema/root/create-item-purchase.js';
import createItem from '#src/schema/root/create-item.js';
import createPlayer from '#src/schema/root/create-player.js';
import createSeriesAndGame from '#src/schema/root/create-series-and-game.js';
import currentGrant from '#src/schema/root/current-grant.js';
import currentSeason from '#src/schema/root/current-season.js';
import deleteBet from '#src/schema/root/delete-bet.js';
import deleteGame from '#src/schema/root/delete-game.js';
import deleteGrant from '#src/schema/root/delete-grant.js';
import items from '#src/schema/root/items.js';
import player from '#src/schema/root/player.js';
import players from '#src/schema/root/players.js';
import series from '#src/schema/root/series.js';
import updateItem from '#src/schema/root/update-item.js';
import updatePlayer from '#src/schema/root/update-player.js';

const { sharedKey } = config.jtspike;

export default {
  defaultValue: {},
  type: {
    object: {
      claimDailyReward,
      completeGame,
      createBet,
      createdBet: { nullable: 'bet' },
      createdBounty: { nullable: 'bounty' },
      createdItem: { nullable: 'item' },
      createdGame: { nullable: 'game' },
      createdGrant: { nullable: 'grant' },
      createdPlayer: { nullable: 'player' },
      createdSeries: { nullable: 'series' },
      createBounty,
      createGame,
      createGrant,
      createItemPurchase,
      createItem,
      createPlayer,
      createSeriesAndGame,
      currentGrant,
      currentSeason,
      deleteBet,
      deleteGame,
      deleteGrant,
      items,
      players,
      player,
      series,
      updateItem,
      updatePlayer
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
        const player = await context.load('players', token.data.player.id);
        context.grant = grant;
        context.player = player;
      } catch (er) {
        throw new PublicError('Invalid grant key provided');
      }
    }

    return value;
  }
};
