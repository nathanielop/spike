// Rich per-player stats for the individual (ESPN-style) player view. Everything
// is computed in SQL and scoped by two inputs mirroring the league stats
// endpoint:
//   - currentSeasonOnly: restrict to the active season (default true).
//   - bySeries: treat a whole series as one win/loss unit rather than a game
//     (default true). Point and skunk stats are intrinsically game-level and are
//     unaffected; sweep stats are intrinsically series-level.
//
// Historically this field was self-only and season/series scoped; those
// defaults are preserved so the existing profile summary keeps working, but the
// guard is lifted so any player's card can be viewed.

import getCurrentSeason from '#src/functions/get-current-season.js';
import getPlayerRank from '#src/functions/get-player-rank.js';

const RECENT_LIMIT = 12;

const notCancelled = `not (s."completedAt" is not null and s."winningSeriesTeamId" is null)`;
const SEED_CUTOFF = '2024-10-18';
const afterSeed = column => `${column} >= '${SEED_CUTOFF}'`;

// Per-game win/loss units for the player (used for record/streaks in game mode
// and always for point/skunk stats).
const gameUnitsSelect = seasonClause => `
  select
    g.id as unit_id,
    g."completedAt" as completed_at,
    g."createdAt" as created_at,
    stm."seriesTeamId" as my_team,
    (g."winningTeamId" = stm."seriesTeamId") as won,
    case when g."winningTeamId" = stm."seriesTeamId"
      then g."losingTeamId" else g."winningTeamId" end as opp_team,
    case when g."winningTeamId" = stm."seriesTeamId"
      then g."winningTeamScore" else g."losingTeamScore" end as my_score,
    case when g."winningTeamId" = stm."seriesTeamId"
      then g."losingTeamScore" else g."winningTeamScore" end as opp_score
  from "seriesTeamMembers" stm
  join games g
    on (g."winningTeamId" = stm."seriesTeamId" or g."losingTeamId" = stm."seriesTeamId")
   and g."completedAt" is not null
  join series s on s.id = g."seriesId"
  where stm."playerId" = ? and ${notCancelled} and ${afterSeed('g."completedAt"')} ${seasonClause}
`;

// Per-series win/loss units for the player (used for record/streaks in series
// mode). Only properly-completed series count.
const seriesUnitsSelect = seasonClause => `
  select
    s.id as unit_id,
    s."completedAt" as completed_at,
    s."createdAt" as created_at,
    stm."seriesTeamId" as my_team,
    (s."winningSeriesTeamId" = stm."seriesTeamId") as won,
    case when s."winningSeriesTeamId" = stm."seriesTeamId"
      then s."losingSeriesTeamId" else s."winningSeriesTeamId" end as opp_team
  from "seriesTeamMembers" stm
  join series s
    on (s."winningSeriesTeamId" = stm."seriesTeamId" or s."losingSeriesTeamId" = stm."seriesTeamId")
  where stm."playerId" = ? and s."completedAt" is not null
    and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${seasonClause}
`;

// Record + current/longest streaks in a single pass over the chosen units.
const recordSql = unitSelect => `
  with units as (${unitSelect}),
  ordered as (
    select won,
           row_number() over (order by completed_at, created_at, unit_id) as rn_all,
           row_number() over (partition by won order by completed_at, created_at, unit_id) as rn_won
    from units
  ),
  groups as (
    select won, count(*) as len, max(rn_all) as last_rn
    from ordered
    group by won, (rn_all - rn_won)
  ),
  total as (select count(*) as c from units)
  select
    (select count(*) filter (where won) from units) as wins,
    (select count(*) filter (where not won) from units) as losses,
    coalesce(max(len) filter (where won), 0) as longest_win,
    coalesce(max(len) filter (where not won), 0) as longest_loss,
    coalesce(max(case when last_rn = (select c from total) and won then len end), 0) as current_win,
    coalesce(max(case when last_rn = (select c from total) and not won then len end), 0) as current_loss
  from groups
`;

// Point totals and game-level skunk counts (always game-based).
const pointsSql = seasonClause => `
  with g as (${gameUnitsSelect(seasonClause)})
  select
    coalesce(sum(my_score), 0) as points_for,
    coalesce(sum(opp_score), 0) as points_against,
    count(*) as games,
    count(*) filter (where won and opp_score = 0) as skunks_delivered,
    count(*) filter (where (not won) and my_score = 0) as times_skunked
  from g
`;

// Series sweeps: won without dropping a game / lost without winning a game.
const sweepsSql = seasonClause => `
  with su as (
    select s.id as series_id,
           stm."seriesTeamId" as my_team,
           (s."winningSeriesTeamId" = stm."seriesTeamId") as won,
           case when s."winningSeriesTeamId" = stm."seriesTeamId"
             then s."losingSeriesTeamId" else s."winningSeriesTeamId" end as opp_team
    from "seriesTeamMembers" stm
    join series s
      on (s."winningSeriesTeamId" = stm."seriesTeamId" or s."losingSeriesTeamId" = stm."seriesTeamId")
    where stm."playerId" = ? and s."completedAt" is not null
      and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${seasonClause}
  )
  select
    count(*) filter (
      where won and (
        select count(*) from games gg
        where gg."seriesId" = series_id and gg."winningTeamId" = opp_team
      ) = 0
    ) as sweeps_delivered,
    count(*) filter (
      where (not won) and (
        select count(*) from games gg
        where gg."seriesId" = series_id and gg."winningTeamId" = my_team
      ) = 0
    ) as times_swept
  from su
`;

// Most successful teammate (by wins together) over the chosen units.
const partnerSql = unitSelect => `
  with units as (${unitSelect})
  select tm."playerId" as player_id,
         count(*) filter (where u.won) as wins,
         count(*) filter (where not u.won) as losses,
         count(*) as games
  from units u
  join "seriesTeamMembers" tm on tm."seriesTeamId" = u.my_team and tm."playerId" <> ?
  group by tm."playerId"
  order by count(*) filter (where u.won) desc, count(*) desc
  limit 1
`;

// Head-to-head totals vs every opponent; nemesis/victim are picked in JS.
const opponentsSql = unitSelect => `
  with units as (${unitSelect})
  select opp."playerId" as player_id,
         count(*) filter (where u.won) as wins,
         count(*) filter (where not u.won) as losses,
         count(*) as games
  from units u
  join "seriesTeamMembers" opp on opp."seriesTeamId" = u.opp_team
  group by opp."playerId"
`;

// Recent series (game log), newest first, with rosters and games-won score.
const recentSql = seasonClause => `
  with su as (
    select s.id as series_id,
           s."completedAt" as completed_at,
           s."createdAt" as created_at,
           stm."seriesTeamId" as my_team,
           (s."winningSeriesTeamId" = stm."seriesTeamId") as won,
           case when s."winningSeriesTeamId" = stm."seriesTeamId"
             then s."losingSeriesTeamId" else s."winningSeriesTeamId" end as opp_team
    from "seriesTeamMembers" stm
    join series s
      on (s."winningSeriesTeamId" = stm."seriesTeamId" or s."losingSeriesTeamId" = stm."seriesTeamId")
    where stm."playerId" = ? and s."completedAt" is not null
      and s."winningSeriesTeamId" is not null and ${afterSeed('s."completedAt"')} ${seasonClause}
    order by s."completedAt" desc, s."createdAt" desc
    limit ?
  )
  select
    series_id,
    completed_at,
    won,
    (select count(*) from games gg where gg."seriesId" = series_id and gg."winningTeamId" = my_team) as my_games,
    (select count(*) from games gg where gg."seriesId" = series_id and gg."winningTeamId" = opp_team) as opp_games,
    (select array_agg(m."playerId") from "seriesTeamMembers" m
       where m."seriesTeamId" = my_team and m."playerId" <> ?) as teammate_ids,
    (select array_agg(m."playerId") from "seriesTeamMembers" m
       where m."seriesTeamId" = opp_team) as opponent_ids
  from su
  order by completed_at desc, created_at desc
`;

const record = {
  object: {
    player: 'player',
    wins: 'integer',
    losses: 'integer',
    games: 'integer'
  }
};

export default {
  type: {
    nullable: {
      object: {
        // Backwards-compatible fields used by the profile summary.
        wins: 'integer',
        losses: 'integer',
        winRate: 'number',
        winStreak: 'integer',
        lossStreak: 'integer',
        rank: { nullable: 'rank' },
        // New: fuller record + streaks.
        games: 'integer',
        longestWinStreak: 'integer',
        longestLossStreak: 'integer',
        elo: 'integer',
        // Scoring (game-level).
        pointsFor: 'integer',
        pointsAgainst: 'integer',
        avgPointsFor: 'number',
        avgPointsAgainst: 'number',
        pointDiff: 'integer',
        // Dominance.
        skunksDelivered: 'integer',
        timesSkunked: 'integer',
        sweepsDelivered: 'integer',
        timesSwept: 'integer',
        // Relationships.
        bestPartner: { nullable: record },
        nemesis: { nullable: record },
        victim: { nullable: record },
        // Game log.
        recentResults: {
          arrayOf: {
            object: {
              won: 'boolean',
              myGames: 'integer',
              oppGames: 'integer',
              teammates: { arrayOf: 'player' },
              opponents: { arrayOf: 'player' },
              completedAt: 'datetime'
            }
          }
        }
      }
    }
  },
  input: {
    object: {
      currentSeasonOnly: { type: 'boolean', defaultValue: true },
      bySeries: { type: 'boolean', defaultValue: true }
    },
    defaultValue: {}
  },
  resolve: async ({
    input: { currentSeasonOnly, bySeries },
    context: { load },
    object: { id }
  }) => {
    const target = await load('players', id);
    if (!target) return;

    const season = currentSeasonOnly ? await getCurrentSeason(load) : null;
    const seasonId = season?.id;
    const seasonClause = seasonId ? `and s."seasonId" = ?` : ``;
    const base = seasonId ? [id, seasonId] : [id];

    const unitSelect = bySeries
      ? seriesUnitsSelect(seasonClause)
      : gameUnitsSelect(seasonClause);

    const { tx } = load;

    const [
      recordRes,
      pointsRes,
      sweepsRes,
      partnerRes,
      opponentsRes,
      recentRes,
      rank
    ] = await Promise.all([
      tx.raw(recordSql(unitSelect), base),
      tx.raw(pointsSql(seasonClause), base),
      tx.raw(sweepsSql(seasonClause), base),
      tx.raw(partnerSql(unitSelect), [...base, id]),
      tx.raw(opponentsSql(unitSelect), base),
      tx.raw(recentSql(seasonClause), [...base, RECENT_LIMIT, id]),
      getPlayerRank({ load, playerId: id })
    ]);

    const r = recordRes.rows[0];
    const wins = Number(r.wins);
    const losses = Number(r.losses);
    const games = wins + losses;

    const p = pointsRes.rows[0];
    const pointsFor = Number(p.points_for);
    const pointsAgainst = Number(p.points_against);
    const gameCount = Number(p.games);

    const sw = sweepsRes.rows[0];

    const toRecord = row =>
      row && {
        player: { id: row.player_id },
        wins: Number(row.wins),
        losses: Number(row.losses),
        games: Number(row.games)
      };

    const opponents = opponentsRes.rows.map(toRecord);
    const nemesis =
      [...opponents]
        .filter(o => o.losses > 0)
        .sort((a, b) => b.losses - a.losses || b.games - a.games)[0] ?? null;
    const victim =
      [...opponents]
        .filter(o => o.wins > 0)
        .sort((a, b) => b.wins - a.wins || b.games - a.games)[0] ?? null;

    const toPlayers = ids => (ids || []).map(pid => ({ id: pid }));

    return {
      wins,
      losses,
      games,
      winRate: games > 0 ? wins / games : 0,
      winStreak: Number(r.current_win),
      lossStreak: Number(r.current_loss),
      longestWinStreak: Number(r.longest_win),
      longestLossStreak: Number(r.longest_loss),
      elo: target.elo,
      rank,
      pointsFor,
      pointsAgainst,
      avgPointsFor: gameCount > 0 ? pointsFor / gameCount : 0,
      avgPointsAgainst: gameCount > 0 ? pointsAgainst / gameCount : 0,
      pointDiff: pointsFor - pointsAgainst,
      skunksDelivered: Number(p.skunks_delivered),
      timesSkunked: Number(p.times_skunked),
      sweepsDelivered: Number(sw.sweeps_delivered),
      timesSwept: Number(sw.times_swept),
      bestPartner: toRecord(partnerRes.rows[0]) ?? null,
      nemesis,
      victim,
      recentResults: recentRes.rows.map(row => ({
        won: row.won,
        myGames: Number(row.my_games),
        oppGames: Number(row.opp_games),
        teammates: toPlayers(row.teammate_ids),
        opponents: toPlayers(row.opponent_ids),
        completedAt: row.completed_at
      }))
    };
  }
};
