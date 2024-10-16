import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';
import groupBy from '#src/functions/group-by.js';
import unique from '#src/functions/unique.js';

export default {
  type: 'root',
  input: {
    object: {
      bestOf: 'format',
      players: {
        arrayOf: { object: { id: 'id', team: { nullable: 'integer' } } },
        minLength: 2,
        maxLength: 10
      }
    },
    validate: ({ value }) => {
      const hasTeams = !!value.players[0].team;
      if (value.players.some(({ team }) => !!team !== hasTeams)) {
        throw new PublicError('Players must all have a team or none');
      }

      if (hasTeams) {
        const teams = unique(value.players.map(({ team }) => team));
        if (hasTeams && teams.length < 2) {
          throw new PublicError('Teams must be unique');
        }

        const teamGroups = groupBy(value.players, 'team');
        const teamSizes = Object.values(teamGroups).map(group => group.length);
        if (teamSizes.some(size => size !== teamSizes[0])) {
          throw new PublicError('Teams must have the same number of players');
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

    if (!players[0].team) {
      const toAssign = players.sort((a, b) => (a.elo < b.elo ? 1 : -1));
      for (let i = 0; i < toAssign.length; i++) toAssign[i].team = i % 2;
    }

    const seriesId = createId();
    const gameId = createId();
    await load.tx.transaction(async tx => {
      await tx
        .insert({ bestOf, id: seriesId, createdAt: new Date() })
        .into('series');

      await tx
        .insert({ id: gameId, seriesId, createdAt: new Date() })
        .into('games');

      const teams = groupBy(players, 'team');
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

    return { createdSeries: { id: seriesId }, createdGame: { id: gameId } };
  }
};
