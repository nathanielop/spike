// All stats are computed in SQL for performance and are only intended to be
// pulled on demand (e.g. a dedicated stats tab) since the aggregations scan the
// full games/series history.
//
// Every win/loss aggregation is parameterised on a "mode" describing what a
// single win-or-loss unit is:
//   - game mode (default): each completed game is a unit.
//   - series mode (`bySeries`): each completed series is a unit, decided by its
//     winning/losing series team. In this mode a "skunk" becomes a sweep (a
//     series in which the losing team won no games).

import getCurrentSeason from '#src/functions/get-current-season.js';

const LIMIT = 10;

// A cancelled series is one that was marked complete without ever crowning a
// winner (its in-progress game was deleted). Those series and their games are
// excluded from every stat. Properly completed and still in-progress series are
// kept. `s` must be aliased to the joined `series` row.
const notCancelled = `not (s."completedAt" is not null and s."winningSeriesTeamId" is null)`;

// The league's early history (games completed on or before 2024-10-17) was
// bulk-imported under old rules that produced an unrealistic number of skunks.
// It's treated as seed data and excluded from every stat; only records on/after
// this cutoff count. `column` is the completedAt to compare (a game's
// `g."completedAt"` or a series' `s."completedAt"`).
const SEED_CUTOFF = '2024-10-18';
const afterSeed = column => `${column} >= '${SEED_CUTOFF}'`;

// Aggregates a team's roster (array of player ids) for a highlight row. `teamCol`
// is the series-team column to resolve members for.
const rosterAgg = teamCol => `(
  select array_agg(stm."playerId")
  from "seriesTeamMembers" stm
  where stm."seriesTeamId" = ${teamCol}
)`;

// ---------------------------------------------------------------------------
// Game mode building blocks (a unit is a single completed game).
// ---------------------------------------------------------------------------

const gameUnitFrom = teamRef => `
  join games g
    on (g."winningTeamId" = ${teamRef} or g."losingTeamId" = ${teamRef})
  join series s on s.id = g."seriesId"
`;

const gameUnitWhere = sf =>
  `g."completedAt" is not null and ${notCancelled} and ${afterSeed('g."completedAt"')} ${sf}`;

const gameSkunkFrom = stmTeam => `
  from games g
  join "seriesTeamMembers" stm on stm."seriesTeamId" = ${stmTeam}
  join series s on s.id = g."seriesId"
`;

// A game the losing side scored 0 in.
const gameSkunkWhere = sf =>
  `g."completedAt" is not null and g."losingTeamScore" = 0 and ${notCancelled} and ${afterSeed('g."completedAt"')} ${sf}`;

const gameHighlightColumns = `
  g."winningTeamScore" as winning_score,
  g."losingTeamScore" as losing_score,
  g."completedAt" as completed_at,
  ${rosterAgg('g."winningTeamId"')} as winner_ids,
  ${rosterAgg('g."losingTeamId"')} as loser_ids
`;

const gameTotalSkunkSql = sf => `
  select count(*)
  from games g
  join series s on s.id = g."seriesId"
  where ${gameSkunkWhere(sf)}
`;

const gameRecentSkunkSql = sf => `
  select ${gameHighlightColumns}
  from games g
  join series s on s.id = g."seriesId"
  where ${gameSkunkWhere(sf)}
  order by g."completedAt" desc, g."createdAt" desc
  limit 1
`;

const gameHighestSql = sf => `
  select ${gameHighlightColumns}
  from games g
  join series s on s.id = g."seriesId"
  where ${gameUnitWhere(sf)}
  order by (g."winningTeamScore" + g."losingTeamScore") desc, g."completedAt" desc
  limit 1
`;

const gameMode = {
  winCol: 'g."winningTeamId"',
  loseCol: 'g."losingTeamId"',
  completedAt: 'g."completedAt"',
  createdAt: 'g."createdAt"',
  unitId: 'g.id',
  unitFrom: gameUnitFrom,
  unitWhere: gameUnitWhere,
  skunkFrom: gameSkunkFrom,
  skunkWhere: gameSkunkWhere,
  totalSkunkSql: gameTotalSkunkSql,
  recentSkunkSql: gameRecentSkunkSql,
  highestSql: gameHighestSql,
  minPlayer: 10,
  minTeam: 5
};

// ---------------------------------------------------------------------------
// Series mode building blocks (a unit is a whole completed series). Only
// properly-completed series (a non-null winner) count, which also excludes
// cancelled and in-progress ones.
// ---------------------------------------------------------------------------

const seriesUnitFrom = teamRef => `
  join series s
    on (s."winningSeriesTeamId" = ${teamRef} or s."losingSeriesTeamId" = ${teamRef})
`;

const seriesUnitWhere = sf =>
  `s."completedAt" is not null and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${sf}`;

const seriesSkunkFrom = stmTeam => `
  from series s
  join "seriesTeamMembers" stm on stm."seriesTeamId" = ${stmTeam}
`;

// The series analogue of a skunk is a sweep: the losing team won no games.
const seriesSkunkWhere = sf => `
  ${seriesUnitWhere(sf)}
  and not exists (
    select 1 from games sg
    where sg."seriesId" = s.id and sg."winningTeamId" = s."losingSeriesTeamId"
  )
`;

// Games won by a given series team, used as the "score" of a series highlight.
const seriesGamesWon = teamCol => `(
  select count(*) from games sg
  where sg."seriesId" = s.id and sg."winningTeamId" = ${teamCol}
)`;

// Sum of a per-game point expression across all completed games of the series.
const seriesPointsSum = expr => `(
  select coalesce(sum(${expr}), 0)
  from games sg
  where sg."seriesId" = s.id and sg."completedAt" is not null
)`;

const seriesRosterCols = `
  ${rosterAgg('s."winningSeriesTeamId"')} as winner_ids,
  ${rosterAgg('s."losingSeriesTeamId"')} as loser_ids
`;

const seriesTotalSkunkSql = sf => `
  select count(*)
  from series s
  where ${seriesSkunkWhere(sf)}
`;

// Most recent sweep; the "score" is games won by each side (loser is always 0).
const seriesRecentSkunkSql = sf => `
  select
    ${seriesGamesWon('s."winningSeriesTeamId"')} as winning_score,
    ${seriesGamesWon('s."losingSeriesTeamId"')} as losing_score,
    s."completedAt" as completed_at,
    ${seriesRosterCols}
  from series s
  where ${seriesSkunkWhere(sf)}
  order by s."completedAt" desc, s."createdAt" desc
  limit 1
`;

// Highest-scoring series: the one with the most combined points across all of
// its games; the "score" is each side's total points across the series.
const seriesHighestSql = sf => `
  select
    ${seriesPointsSum(
      `case when sg."winningTeamId" = s."winningSeriesTeamId" then sg."winningTeamScore" else sg."losingTeamScore" end`
    )} as winning_score,
    ${seriesPointsSum(
      `case when sg."winningTeamId" = s."winningSeriesTeamId" then sg."losingTeamScore" else sg."winningTeamScore" end`
    )} as losing_score,
    s."completedAt" as completed_at,
    ${seriesRosterCols}
  from series s
  where ${seriesUnitWhere(sf)}
  order by ${seriesPointsSum(
    `sg."winningTeamScore" + sg."losingTeamScore"`
  )} desc, s."completedAt" desc
  limit 1
`;

const seriesMode = {
  winCol: 's."winningSeriesTeamId"',
  loseCol: 's."losingSeriesTeamId"',
  completedAt: 's."completedAt"',
  createdAt: 's."createdAt"',
  unitId: 's.id',
  unitFrom: seriesUnitFrom,
  unitWhere: seriesUnitWhere,
  skunkFrom: seriesSkunkFrom,
  skunkWhere: seriesSkunkWhere,
  totalSkunkSql: seriesTotalSkunkSql,
  recentSkunkSql: seriesRecentSkunkSql,
  highestSql: seriesHighestSql,
  // Fewer series than games are played, so use looser minimums for rate stats.
  minPlayer: 5,
  minTeam: 3
};

// ---------------------------------------------------------------------------
// Mode-parameterised aggregations.
// ---------------------------------------------------------------------------

// Per-team (>= 2 players) win/loss totals across all counted units. Teams are
// identified by their exact roster of players, so the same duo is aggregated
// across every series they've played together.
const teamAggSql = (mode, sf) => `
  with team_players as (
    select "seriesTeamId" as team_id,
           array_agg("playerId" order by "playerId") as player_ids
    from "seriesTeamMembers"
    group by "seriesTeamId"
  ),
  keyed as (
    select team_id, player_ids, array_to_string(player_ids, ',') as team_key
    from team_players
  ),
  results as (
    select k.team_key,
           min(k.player_ids) as player_ids,
           count(*) filter (where ${mode.winCol} = k.team_id) as wins,
           count(*) filter (where ${mode.loseCol} = k.team_id) as losses
    from keyed k
    ${mode.unitFrom('k.team_id')}
    where ${mode.unitWhere(sf)}
    group by k.team_key
  )
  select player_ids, wins, losses, (wins + losses) as games
  from results
  where array_length(player_ids, 1) >= 2
`;

// Per-player win/loss totals across all counted units.
const playerAggSql = (mode, sf) => `
  select stm."playerId" as player_id,
         count(*) filter (where ${mode.winCol} = stm."seriesTeamId") as wins,
         count(*) filter (where ${mode.loseCol} = stm."seriesTeamId") as losses
  from "seriesTeamMembers" stm
  ${mode.unitFrom('stm."seriesTeamId"')}
  where ${mode.unitWhere(sf)}
  group by stm."playerId"
`;

// Players who won the most units in which the opponent was skunked/swept.
const skunksDeliveredSql = (mode, sf) => `
  select stm."playerId" as player_id, count(*) as count
  ${mode.skunkFrom(mode.winCol)}
  where ${mode.skunkWhere(sf)}
  group by stm."playerId"
  order by count(*) desc, stm."playerId"
  limit ?
`;

// Players who have been skunked/swept the most.
const skunkedSql = (mode, sf) => `
  select stm."playerId" as player_id, count(*) as count
  ${mode.skunkFrom(mode.loseCol)}
  where ${mode.skunkWhere(sf)}
  group by stm."playerId"
  order by count(*) desc, stm."playerId"
  limit ?
`;

// Longest consecutive win streak per player over the counted units (classic
// gaps-and-islands: consecutive wins share the same (rn_all - rn_won) group).
const streakSql = (mode, sf) => `
  with player_games as (
    select stm."playerId" as player_id,
           ${mode.completedAt} as completed_at,
           ${mode.createdAt} as created_at,
           ${mode.unitId} as unit_id,
           (${mode.winCol} = stm."seriesTeamId") as won
    from "seriesTeamMembers" stm
    ${mode.unitFrom('stm."seriesTeamId"')}
    where ${mode.unitWhere(sf)}
  ),
  grouped as (
    select player_id, won,
           row_number() over (partition by player_id order by completed_at, created_at, unit_id)
           - row_number() over (partition by player_id, won order by completed_at, created_at, unit_id) as grp
    from player_games
  ),
  streaks as (
    select player_id, grp, count(*) as streak
    from grouped
    where won
    group by player_id, grp
  )
  select player_id, max(streak) as streak
  from streaks
  group by player_id
  order by max(streak) desc, player_id
  limit ?
`;

// Totals: games and series counts are unit-independent facts; only the "skunks"
// count follows the mode (game skunks vs. series sweeps).
const totalsSql = (mode, sf) => `
  select
    (
      select count(*)
      from games g
      join series s on s.id = g."seriesId"
      where g."completedAt" is not null and ${notCancelled} and ${afterSeed('g."completedAt"')} ${sf}
    ) as games,
    (
      select count(*)
      from series s
      where s."completedAt" is not null
        and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${sf}
    ) as series,
    ( ${mode.totalSkunkSql(sf)} ) as skunks
`;

const playerRecord = {
  arrayOf: {
    object: {
      player: 'player',
      wins: 'integer',
      losses: 'integer',
      games: 'integer'
    }
  }
};

const playerPct = {
  arrayOf: {
    object: {
      player: 'player',
      wins: 'integer',
      losses: 'integer',
      games: 'integer',
      winPct: 'number'
    }
  }
};

const playerCount = {
  arrayOf: { object: { player: 'player', count: 'integer' } }
};

const playerStreak = {
  arrayOf: { object: { player: 'player', streak: 'integer' } }
};

const teamRecord = {
  arrayOf: {
    object: {
      players: { arrayOf: 'player' },
      wins: 'integer',
      losses: 'integer',
      games: 'integer'
    }
  }
};

const teamPct = {
  arrayOf: {
    object: {
      players: { arrayOf: 'player' },
      wins: 'integer',
      losses: 'integer',
      games: 'integer',
      winPct: 'number'
    }
  }
};

const gameHighlight = {
  nullable: {
    object: {
      winners: { arrayOf: 'player' },
      losers: { arrayOf: 'player' },
      winningScore: 'integer',
      losingScore: 'integer',
      completedAt: 'datetime'
    }
  }
};

export default {
  type: {
    object: {
      totals: {
        object: { games: 'integer', series: 'integer', skunks: 'integer' }
      },
      players: {
        object: {
          mostWins: playerRecord,
          mostLosses: playerRecord,
          bestWinPct: playerPct,
          mostGamesPlayed: playerRecord,
          longestWinStreak: playerStreak,
          mostSkunksDelivered: playerCount,
          mostSkunked: playerCount
        }
      },
      teams: {
        object: {
          mostWins: teamRecord,
          mostLosses: teamRecord,
          bestWinPct: teamPct,
          worstWinPct: teamPct
        }
      },
      highlights: {
        object: {
          mostRecentSkunk: gameHighlight,
          highestScoringGame: gameHighlight
        }
      },
      // Echoes the effective rate-stat minimums so the UI can label them.
      minPlayerGames: 'integer',
      minTeamGames: 'integer'
    }
  },
  input: {
    object: {
      currentSeasonOnly: { type: 'boolean', defaultValue: false },
      // When true, win/loss records, streaks and skunks are computed per series
      // (a skunk becomes a sweep) rather than per game.
      bySeries: { type: 'boolean', defaultValue: false }
    }
  },
  resolve: async ({
    input: { currentSeasonOnly, bySeries },
    context: { load }
  }) => {
    const { tx } = load;

    const mode = bySeries ? seriesMode : gameMode;

    const season = currentSeasonOnly ? await getCurrentSeason(load) : null;
    const seasonId = season?.id;

    // Optional per-query season restriction (the not-cancelled guard is always
    // applied). `sb` are the bindings for a query that references it once.
    const seriesFilter = seasonId ? `and s."seasonId" = ?` : ``;
    const sb = seasonId ? [seasonId] : [];

    const [
      teamAgg,
      playerAgg,
      skunksDelivered,
      skunked,
      streaks,
      recentSkunk,
      highestScoring,
      totals
    ] = await Promise.all([
      tx.raw(teamAggSql(mode, seriesFilter), sb),
      tx.raw(playerAggSql(mode, seriesFilter), sb),
      tx.raw(skunksDeliveredSql(mode, seriesFilter), [...sb, LIMIT]),
      tx.raw(skunkedSql(mode, seriesFilter), [...sb, LIMIT]),
      tx.raw(streakSql(mode, seriesFilter), [...sb, LIMIT]),
      tx.raw(mode.recentSkunkSql(seriesFilter), sb),
      tx.raw(mode.highestSql(seriesFilter), sb),
      tx.raw(
        totalsSql(mode, seriesFilter),
        seasonId ? [seasonId, seasonId, seasonId] : []
      )
    ]);

    const toPlayers = ids => (ids || []).map(id => ({ id }));

    const mapGame = row =>
      row && {
        winners: toPlayers(row.winner_ids),
        losers: toPlayers(row.loser_ids),
        winningScore: row.winning_score,
        losingScore: row.losing_score,
        completedAt: row.completed_at
      };

    const pct = r => (r.games > 0 ? r.wins / r.games : 0);
    const topBy = (arr, cmp) => [...arr].sort(cmp).slice(0, LIMIT);
    const withPct = r => ({ ...r, winPct: pct(r) });

    const teams = teamAgg.rows.map(r => ({
      players: toPlayers(r.player_ids),
      wins: r.wins,
      losses: r.losses,
      games: r.games
    }));

    const players = playerAgg.rows.map(r => ({
      player: { id: r.player_id },
      wins: r.wins,
      losses: r.losses,
      games: r.wins + r.losses
    }));

    return {
      totals: {
        games: totals.rows[0].games,
        series: totals.rows[0].series,
        skunks: totals.rows[0].skunks
      },
      players: {
        mostWins: topBy(
          players,
          (a, b) => b.wins - a.wins || b.games - a.games
        ),
        mostLosses: topBy(
          players,
          (a, b) => b.losses - a.losses || b.games - a.games
        ),
        bestWinPct: topBy(
          players.filter(p => p.games >= mode.minPlayer),
          (a, b) => pct(b) - pct(a) || b.games - a.games
        ).map(withPct),
        mostGamesPlayed: topBy(players, (a, b) => b.games - a.games),
        longestWinStreak: streaks.rows.map(r => ({
          player: { id: r.player_id },
          streak: r.streak
        })),
        mostSkunksDelivered: skunksDelivered.rows.map(r => ({
          player: { id: r.player_id },
          count: r.count
        })),
        mostSkunked: skunked.rows.map(r => ({
          player: { id: r.player_id },
          count: r.count
        }))
      },
      teams: {
        mostWins: topBy(teams, (a, b) => b.wins - a.wins || b.games - a.games),
        mostLosses: topBy(
          teams,
          (a, b) => b.losses - a.losses || b.games - a.games
        ),
        bestWinPct: topBy(
          teams.filter(t => t.games >= mode.minTeam),
          (a, b) => pct(b) - pct(a) || b.games - a.games
        ).map(withPct),
        worstWinPct: topBy(
          teams.filter(t => t.games >= mode.minTeam),
          (a, b) => pct(a) - pct(b) || b.games - a.games
        ).map(withPct)
      },
      highlights: {
        mostRecentSkunk: mapGame(recentSkunk.rows[0]),
        highestScoringGame: mapGame(highestScoring.rows[0])
      },
      minPlayerGames: mode.minPlayer,
      minTeamGames: mode.minTeam
    };
  }
};
