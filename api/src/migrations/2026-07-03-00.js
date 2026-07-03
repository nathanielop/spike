// Adds indices to speed up the stats endpoint (api/src/schema/root/stats.js),
// whose aggregations repeatedly join and filter across the full games/series
// history. Postgres does not automatically index foreign-key columns, so the
// many `games.seriesId`, `games.winningTeamId`/`losingTeamId` and
// `seriesTeamMembers.seriesTeamId`/`playerId` joins were all falling back to
// sequential scans.
//
// - games."seriesId":                 games -> series join (every stat query).
// - games."winningTeamId"/"losingTeamId": team/player aggregation joins onto
//   seriesTeamMembers, plus highlight roster lookups.
// - games."completedAt":              only counted games have completedAt set;
//   the skunk/highlight queries also order by it.
// - seriesTeamMembers."seriesTeamId": join from a team to its members.
// - seriesTeamMembers."playerId":     per-player grouping.
// - seriesTeams."seriesId":           team -> series lookups.
// - series."seasonId":                the "current season only" filter.
const indices = [
  ['games', 'seriesId'],
  ['games', 'winningTeamId'],
  ['games', 'losingTeamId'],
  ['games', 'completedAt'],
  ['seriesTeamMembers', 'seriesTeamId'],
  ['seriesTeamMembers', 'playerId'],
  ['seriesTeams', 'seriesId'],
  ['series', 'seasonId']
];

const indexName = (table, column) => `${table}_${column}_index`;

export default {
  up: async tx => {
    for (const [table, column] of indices) {
      await tx.raw(`create index if not exists ?? on ?? (??)`, [
        indexName(table, column),
        table,
        column
      ]);
    }
  },
  down: async tx => {
    for (const [table, column] of indices) {
      await tx.raw(`drop index if exists ??`, [indexName(table, column)]);
    }
  }
};
