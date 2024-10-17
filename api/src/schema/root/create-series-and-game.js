import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';
import getGameOdds from '#src/functions/get-game-odds.js';
import groupBy from '#src/functions/group-by.js';
import postToSlack from '#src/functions/post-to-slack.js';
import unique from '#src/functions/unique.js';

const { console, URLSearchParams } = globalThis;

const { appUrl } = config.jtspike;

export default {
  type: 'root',
  input: {
    object: {
      bestOf: 'format',
      players: {
        arrayOf: { object: { id: 'id', team: { nullable: 'integer' } } },
        minLength: 4,
        maxLength: 4
      }
    },
    validate: ({ value }) => {
      const hasTeams = value.players[0].team !== null;
      if (value.players.some(({ team }) => (team !== null) !== hasTeams)) {
        throw new PublicError('Players must all have a team or none');
      }

      if (hasTeams) {
        const teams = unique(value.players.map(({ team }) => team));
        if (teams.length < 2) {
          throw new PublicError('There must be two teams');
        }
      }

      const playerIds = unique(value.players.map(({ id }) => id));
      if (playerIds.length !== value.players.length) {
        throw new PublicError('Players must be unique');
      }

      return value;
    }
  },
  resolve: async ({
    context: { load, player },
    input: { bestOf, players: _players }
  }) => {
    if (!player?.isAdmin) {
      throw new PublicError(
        'You do not have permission to create a new series'
      );
    }

    const players = await load.tx
      .select()
      .from('players')
      .whereIn(
        'id',
        _players.map(({ id }) => id)
      );
    if (players.length !== _players.length) {
      throw new PublicError('Players do not exist');
    }

    if (players[0].team == null) {
      const toAssign = players.sort((a, b) => (a.elo < b.elo ? 1 : -1));
      toAssign[0].team = 0;
      toAssign[3].team = 0;
      toAssign[1].team = 1;
      toAssign[2].team = 1;
    }

    const teams = groupBy(players, 'team');
    const seriesId = createId();
    const gameId = createId();
    await load.tx.transaction(async tx => {
      await tx
        .insert({ bestOf, id: seriesId, createdAt: new Date() })
        .into('series');

      await tx
        .insert({ id: gameId, seriesId, createdAt: new Date() })
        .into('games');

      const teamIds = Object.fromEntries(
        Object.keys(teams).map(teamId => [teamId, createId()])
      );
      await tx
        .insert(
          Object.values(teamIds).map(id => ({
            id,
            seriesId,
            createdAt: new Date()
          }))
        )
        .into('seriesTeams');

      await tx
        .insert(
          players.map(({ id, team }) => ({
            id: createId(),
            playerId: id,
            seriesTeamId: teamIds[team],
            createdAt: new Date()
          }))
        )
        .into('seriesTeamMembers');
    });

    try {
      const odds = getGameOdds(...Object.values(teams));
      await postToSlack({
        subject: Object.values(teams)
          .map(
            (players, i) =>
              `${players.map(({ name }) => name).join(' & ')} (${Math.round(odds[i] * 100)}%)`
          )
          .join(' vs '),
        title: `*GAME STARTING*`,
        linkText: 'Place your bets',
        linkUrl: `${appUrl}/profile?${new URLSearchParams({ bet: true, seriesId })}`
      });
    } catch (er) {
      console.log('Error sending slack message', er);
    }

    return { createdSeries: { id: seriesId }, createdGame: { id: gameId } };
  }
};
