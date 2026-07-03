// All stats are computed in SQL for performance and are only intended to be
// pulled on demand (e.g. a dedicated stats tab) since the aggregations scan the
// full games/series history.

import getCurrentSeason from '#src/functions/get-current-season.js';

const LIMIT = 10;
const MIN_TEAM_GAMES = 5;
const MIN_PLAYER_GAMES = 10;

// A cancelled series is one that was marked complete without ever crowning a
// winner (its in-progress game was deleted). Those series and their games are
// excluded from every stat. Properly completed and still in-progress series are
// kept. `s` must be aliased to the joined `series` row.
const notCancelled = `not (s."completedAt" is not null and s."winningSeriesTeamId" is null)`;

// The league's early history (games completed on or before 2024-10-17) was
// bulk-imported under old rules that produced an unrealistic number of skunks.
// It's treated as seed data and excluded from every stat; only games completed
// on/after this cutoff count. `column` is the completedAt to compare (a game's
// `g."completedAt"` or a series' `s."completedAt"`).
const SEED_CUTOFF = '2024-10-18';
const afterSeed = column => `${column} >= '${SEED_CUTOFF}'`;

// Per-team (>= 2 players) win/loss totals across all counted games. Teams are
// identified by their exact roster of players, so the same duo is aggregated
// across every series they've played together.
const teamAggSql = seriesFilter => `
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
           count(*) filter (where g."winningTeamId" = k.team_id) as wins,
           count(*) filter (where g."losingTeamId" = k.team_id) as losses
    from keyed k
    join games g
      on (g."winningTeamId" = k.team_id or g."losingTeamId" = k.team_id)
     and g."completedAt" is not null
    join series s on s.id = g."seriesId"
    where ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
    group by k.team_key
  )
  select player_ids, wins, losses, (wins + losses) as games
  from results
  where array_length(player_ids, 1) >= 2
`;

// Per-player win/loss totals across all counted games.
const playerAggSql = seriesFilter => `
  select stm."playerId" as player_id,
         count(*) filter (where g."winningTeamId" = stm."seriesTeamId") as wins,
         count(*) filter (where g."losingTeamId" = stm."seriesTeamId") as losses
  from "seriesTeamMembers" stm
  join games g
    on (g."winningTeamId" = stm."seriesTeamId" or g."losingTeamId" = stm."seriesTeamId")
   and g."completedAt" is not null
  join series s on s.id = g."seriesId"
  where ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  group by stm."playerId"
`;

// Players who have won the most games in which the opponent was skunked (0 pts).
const skunksDeliveredSql = seriesFilter => `
  select stm."playerId" as player_id, count(*) as count
  from games g
  join "seriesTeamMembers" stm on stm."seriesTeamId" = g."winningTeamId"
  join series s on s.id = g."seriesId"
  where g."completedAt" is not null and g."losingTeamScore" = 0
    and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  group by stm."playerId"
  order by count(*) desc, stm."playerId"
  limit ?
`;

// Players who have been skunked (scored 0 in a counted game) the most.
const skunkedSql = seriesFilter => `
  select stm."playerId" as player_id, count(*) as count
  from games g
  join "seriesTeamMembers" stm on stm."seriesTeamId" = g."losingTeamId"
  join series s on s.id = g."seriesId"
  where g."completedAt" is not null and g."losingTeamScore" = 0
    and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  group by stm."playerId"
  order by count(*) desc, stm."playerId"
  limit ?
`;

// Longest all-time consecutive game win streak per player (classic
// gaps-and-islands: consecutive wins share the same (rn_all - rn_won) group).
const streakSql = seriesFilter => `
  with player_games as (
    select stm."playerId" as player_id,
           g."completedAt" as completed_at,
           g."createdAt" as created_at,
           g.id as game_id,
           (g."winningTeamId" = stm."seriesTeamId") as won
    from "seriesTeamMembers" stm
    join games g
      on (g."winningTeamId" = stm."seriesTeamId" or g."losingTeamId" = stm."seriesTeamId")
     and g."completedAt" is not null
    join series s on s.id = g."seriesId"
    where ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  ),
  grouped as (
    select player_id, won,
           row_number() over (partition by player_id order by completed_at, created_at, game_id)
           - row_number() over (partition by player_id, won order by completed_at, created_at, game_id) as grp
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

const gameHighlightColumns = `
  g."winningTeamScore" as winning_score,
  g."losingTeamScore" as losing_score,
  g."completedAt" as completed_at,
  (
    select array_agg(stm."playerId")
    from "seriesTeamMembers" stm
    where stm."seriesTeamId" = g."winningTeamId"
  ) as winner_ids,
  (
    select array_agg(stm."playerId")
    from "seriesTeamMembers" stm
    where stm."seriesTeamId" = g."losingTeamId"
  ) as loser_ids
`;

const recentSkunkSql = seriesFilter => `
  select ${gameHighlightColumns}
  from games g
  join series s on s.id = g."seriesId"
  where g."completedAt" is not null and g."losingTeamScore" = 0
    and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  order by g."completedAt" desc, g."createdAt" desc
  limit 1
`;

const highestScoringSql = seriesFilter => `
  select ${gameHighlightColumns}
  from games g
  join series s on s.id = g."seriesId"
  where g."completedAt" is not null
    and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
  order by (g."winningTeamScore" + g."losingTeamScore") desc, g."completedAt" desc
  limit 1
`;

const totalsSql = seriesFilter => `
  select
    (
      select count(*)
      from games g
      join series s on s.id = g."seriesId"
      where g."completedAt" is not null and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
    ) as games,
    (
      select count(*)
      from series s
      where s."completedAt" is not null
        and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${seriesFilter}
    ) as series,
    (
      select count(*)
      from games g
      join series s on s.id = g."seriesId"
      where g."completedAt" is not null and g."losingTeamScore" = 0
        and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seriesFilter}
    ) as skunks
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
      }
    }
  },
  input: {
    object: {
      currentSeasonOnly: { type: 'boolean', defaultValue: false }
    }
  },
  resolve: async ({ input: { currentSeasonOnly }, context: { load } }) => {
    const { tx } = load;

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
      tx.raw(teamAggSql(seriesFilter), sb),
      tx.raw(playerAggSql(seriesFilter), sb),
      tx.raw(skunksDeliveredSql(seriesFilter), [...sb, LIMIT]),
      tx.raw(skunkedSql(seriesFilter), [...sb, LIMIT]),
      tx.raw(streakSql(seriesFilter), [...sb, LIMIT]),
      tx.raw(recentSkunkSql(seriesFilter), sb),
      tx.raw(highestScoringSql(seriesFilter), sb),
      tx.raw(
        totalsSql(seriesFilter),
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
          players.filter(p => p.games >= MIN_PLAYER_GAMES),
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
          teams.filter(t => t.games >= MIN_TEAM_GAMES),
          (a, b) => pct(b) - pct(a) || b.games - a.games
        ).map(withPct),
        worstWinPct: topBy(
          teams.filter(t => t.games >= MIN_TEAM_GAMES),
          (a, b) => pct(a) - pct(b) || b.games - a.games
        ).map(withPct)
      },
      highlights: {
        mostRecentSkunk: mapGame(recentSkunk.rows[0]),
        highestScoringGame: mapGame(highestScoring.rows[0])
      }
    };
  }
};
