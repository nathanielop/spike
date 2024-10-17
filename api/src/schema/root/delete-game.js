import PublicError from '#src/constants/public-error.js';

export default {
  type: 'root',
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load, player } }) => {
    const game = await load('games', id);
    if (!game || !player?.isAdmin) {
      throw new PublicError("You don't have permission to delete this game");
    }

    if (game.completedAt) {
      throw new PublicError('You cannot delete a completed game');
    }

    await load.tx.transaction(async tx => {
      await tx.delete().from('games').where({ id });

      await tx
        .table('series')
        .update({ completedAt: new Date() })
        .where({ id: game.seriesId });

      const bets = await tx
        .select('bets.*', 'players.credits as playerCredits')
        .from('bets')
        .join('players', 'players.id', 'bets.playerId')
        .join('seriesTeams', 'seriesTeams.id', 'bets.seriesTeamId')
        .where({ seriesId: game.seriesId });

      if (bets.length) {
        const betValues = bets.map(bet => [
          bet.playerId,
          bet.amount + bet.playerCredits
        ]);

        await tx.raw(
          `
          update players
          set credits = data.credits::integer
          from (values ${Array.from(betValues, () => '(?, ?)').join(
            ', '
          )}) as data (id, credits)
          where players.id = data.id
          `,
          betValues.flat()
        );

        await tx
          .delete()
          .from('bets')
          .join('seriesTeams', 'seriesTeams.id', 'bets.seriesTeamId')
          .where({ seriesId: game.seriesId });
      }
    });
  }
};
