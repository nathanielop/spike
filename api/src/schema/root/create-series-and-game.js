import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';
import groupBy from '#src/functions/group-by.js';
import unique from '#src/functions/unique.js';

export default {
  type: { createdSeries: 'series', createdGame: 'game' },
  cost: 100,
  input: {
    object: {
      format: 'format',
      players: {
        arrayOf: { object: { id: 'id', team: 'int' } },
        minLength: 2,
        maxLength: 10
      }
    },
    validate: ({ value }) => {
      const teams = unique(value.players.map(({ team }) => team));
      if (teams.length < 2) {
        throw new PublicError('Teams must be unique');
      }

      const playerIds = unique(value.players.map(({ id }) => id));
      if (playerIds.length !== value.players.length) {
        throw new PublicError('Players must be unique');
      }

      const teamGroups = groupBy(value.players, 'team');
      const teamSizes = Object.values(teamGroups).map(group => group.length);
      if (teamSizes.some(size => size !== teamSizes[0])) {
        throw new PublicError('Teams must have the same number of players');
      }

      return value;
    }
  },
  resolve: async ({ context: { load }, input: { format, players } }) => {
    if (
      (
        await load.tx
          .select()
          .from('players')
          .whereIn(
            'id',
            players.map(({ id }) => id)
          )
      ).length !== players.length
    ) {
      throw new PublicError('Players do not exist');
    }

    const seriesId = createId();
    const gameId = createId();
    await load.tx.transaction(async tx => {
      await tx
        .insert({ format, id: seriesId, createdAt: new Date() })
        .into('series');

      await tx
        .insert({ id: gameId, seriesId, createdAt: new Date() })
        .into('games');

      const teams = groupBy(players, 'team');
      const teamIds = Object.keys(teams).map(() => createId());
      await tx
        .insert(teamIds.map(id => ({ id, seriesId, createdAt: new Date() })))
        .into('seriesTeams');

      await tx
        .insert(
          players.map(({ id, team }) => ({
            id: createId(),
            playerId: id,
            seriesTeamId: teamIds[team - 1],
            createdAt: new Date()
          }))
        )
        .into('seriesTeamMembers');
    });

    return { createdSeries: { id: seriesId }, createdGame: { id: gameId } };
  }
};
