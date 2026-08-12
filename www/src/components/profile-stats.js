import clsx from 'clsx';
import { useState } from 'endr';
import { DateTime } from 'luxon';

import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import UserAvatar from '#src/components/user-avatar.js';
import titleize from '#src/functions/titleize.js';
import usePave from '#src/hooks/use-pave.js';

const playerQ = { id: {}, name: {}, avatarUrl: { $: { size: 200 } } };
const playerRecordQ = { player: playerQ, wins: {}, losses: {}, games: {} };
const playerPctQ = {
  player: playerQ,
  wins: {},
  losses: {},
  games: {},
  winPct: {}
};
const teamRecordQ = { players: playerQ, wins: {}, losses: {}, games: {} };
const teamPctQ = {
  players: playerQ,
  wins: {},
  losses: {},
  games: {},
  winPct: {}
};
const gameQ = {
  winners: playerQ,
  losers: playerQ,
  winningScore: {},
  losingScore: {},
  completedAt: {}
};

const statsFields = {
  totals: { games: {}, series: {}, skunks: {} },
  players: {
    mostWins: playerRecordQ,
    mostLosses: playerRecordQ,
    bestWinPct: playerPctQ,
    mostGamesPlayed: playerRecordQ,
    longestWinStreak: { player: playerQ, streak: {} },
    mostSkunksDelivered: { player: playerQ, count: {} },
    mostSkunked: { player: playerQ, count: {} }
  },
  teams: {
    mostWins: teamRecordQ,
    mostLosses: teamRecordQ,
    bestWinPct: teamPctQ,
    worstWinPct: teamPctQ
  },
  highlights: {
    mostRecentSkunk: gameQ,
    highestScoringGame: gameQ
  },
  minPlayerGames: {},
  minTeamGames: {}
};

// --- Individual (ESPN-style) player view queries -------------------------

const relQ = { player: playerQ, wins: {}, losses: {}, games: {} };

// Header avatar needs equipped items + bounty state to render hats/badges.
const avatarPlayerQ = {
  id: {},
  name: {},
  avatarUrl: { $: { size: 400 } },
  activeBounties: { id: {} },
  items: {
    item: { id: {}, type: {}, attributes: {} },
    isEquipped: {}
  }
};

const playerStatsFields = {
  wins: {},
  losses: {},
  games: {},
  winRate: {},
  winStreak: {},
  lossStreak: {},
  longestWinStreak: {},
  longestLossStreak: {},
  elo: {},
  rank: {},
  pointsFor: {},
  pointsAgainst: {},
  avgPointsFor: {},
  avgPointsAgainst: {},
  pointDiff: {},
  skunksDelivered: {},
  timesSkunked: {},
  sweepsDelivered: {},
  timesSwept: {},
  bestPartner: relQ,
  nemesis: relQ,
  victim: relQ,
  recentResults: {
    won: {},
    myGames: {},
    oppGames: {},
    completedAt: {},
    teammates: playerQ,
    opponents: playerQ
  }
};

const fmtPct = n => `${Math.round(n * 100)}%`;
const formatDate = dt =>
  dt ? DateTime.fromISO(dt).toLocaleString(DateTime.DATE_MED) : '';
const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1);

const StatCard = ({ title, subtitle, children }) => (
  <div className='bg-white border rounded-lg overflow-hidden'>
    <div className='px-3 py-2 border-b bg-gray-50'>
      <div className='font-semibold text-gray-800 text-sm'>{title}</div>
      {subtitle && (
        <div className='text-xs text-gray-400 leading-none mt-0.5'>
          {subtitle}
        </div>
      )}
    </div>
    {children}
  </div>
);

const Empty = () => (
  <div className='px-3 py-6 text-center text-sm text-gray-400'>
    Not enough games yet
  </div>
);

const Rank = ({ i }) => (
  <div className='w-6 shrink-0 text-center text-sm font-semibold text-gray-400'>
    {medal(i)}
  </div>
);

const Value = ({ value, sub }) => (
  <div className='text-right shrink-0'>
    <div className='text-sm font-semibold text-gray-900'>{value}</div>
    {sub && <div className='text-xs text-gray-400 leading-none'>{sub}</div>}
  </div>
);

const PlayerRow = ({ i, player, value, sub }) => (
  <div className='flex items-center gap-3 border-t px-3 py-2'>
    <Rank i={i} />
    <UserAvatar
      player={player}
      resetShadow
      resetRounding
      textClassName='text-[5px]'
      className='h-8 w-8 shrink-0 border rounded'
    />
    <div className='flex-1 truncate text-sm text-gray-800'>{player.name}</div>
    <Value value={value} sub={sub} />
  </div>
);

const TeamRow = ({ i, players, value, sub }) => (
  <div className='flex items-center gap-3 border-t px-3 py-2'>
    <Rank i={i} />
    <div className='flex -space-x-2 shrink-0'>
      {players.map(p => (
        <UserAvatar
          key={p.id}
          player={p}
          resetShadow
          resetRounding
          textClassName='text-[5px]'
          className='h-8 w-8 border rounded ring-2 ring-white'
        />
      ))}
    </div>
    <div className='flex-1 truncate text-sm text-gray-800'>
      {players.map(p => p.name).join(' & ')}
    </div>
    <Value value={value} sub={sub} />
  </div>
);

const playerCard = ({ title, subtitle, items, value, sub }) => (
  <StatCard title={title} subtitle={subtitle}>
    {items.length ? (
      items.map((it, i) => (
        <PlayerRow
          key={it.player.id}
          i={i}
          player={it.player}
          value={value(it)}
          sub={sub && sub(it)}
        />
      ))
    ) : (
      <Empty />
    )}
  </StatCard>
);

const teamCard = ({ title, subtitle, items, value, sub }) => (
  <StatCard title={title} subtitle={subtitle}>
    {items.length ? (
      items.map((it, i) => (
        <TeamRow
          key={it.players.map(p => p.id).join(',')}
          i={i}
          players={it.players}
          value={value(it)}
          sub={sub && sub(it)}
        />
      ))
    ) : (
      <Empty />
    )}
  </StatCard>
);

const TeamMini = ({ players, right }) => (
  <div className={clsx('flex-1 min-w-0 space-y-1', right && 'text-right')}>
    {players.map(p => (
      <div
        key={p.id}
        className={clsx(
          'flex items-center gap-1.5',
          right && 'flex-row-reverse'
        )}
      >
        <UserAvatar
          player={p}
          resetShadow
          resetRounding
          textClassName='text-[5px]'
          className='h-6 w-6 shrink-0 border rounded'
        />
        <span className='text-xs text-gray-700 truncate'>{p.name}</span>
      </div>
    ))}
  </div>
);

const HighlightCard = ({ title, subtitle, game }) => (
  <div className='bg-white border rounded-lg overflow-hidden'>
    <div className='px-3 py-2 border-b bg-gray-50'>
      <div className='font-semibold text-gray-800 text-sm'>{title}</div>
      {subtitle && (
        <div className='text-xs text-gray-400 leading-none mt-0.5'>
          {subtitle}
        </div>
      )}
    </div>
    {game ? (
      <div className='p-3 flex items-center gap-2'>
        <TeamMini players={game.winners} />
        <div className='text-center shrink-0 px-1'>
          <div className='text-lg font-bold text-gray-900 leading-none'>
            {game.winningScore}&ndash;{game.losingScore}
          </div>
          <div className='text-[10px] uppercase tracking-wide text-gray-400 mt-1'>
            {formatDate(game.completedAt)}
          </div>
        </div>
        <TeamMini players={game.losers} right />
      </div>
    ) : (
      <Empty />
    )}
  </div>
);

const Total = ({ label, value }) => (
  <div className='bg-white border rounded-lg p-3 text-center'>
    <div className='text-2xl font-bold text-gray-900'>{value}</div>
    <div className='text-xs uppercase tracking-wide text-gray-400'>{label}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div className='space-y-2'>
    <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
      {title}
    </h2>
    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>{children}</div>
  </div>
);

// --- ESPN-style individual player view -----------------------------------

const HeroStat = ({ label, value }) => (
  <div className='py-2'>
    <div className='text-xl font-bold leading-none'>{value}</div>
    <div className='text-[10px] uppercase tracking-wide text-gray-400 mt-1'>
      {label}
    </div>
  </div>
);

const StatTile = ({ label, value, sub, accent }) => (
  <div className='bg-white border rounded-lg p-3 text-center'>
    <div className={clsx('text-2xl font-bold', accent || 'text-gray-900')}>
      {value}
    </div>
    <div className='text-[11px] uppercase tracking-wide text-gray-400 mt-0.5'>
      {label}
    </div>
    {sub && (
      <div className='text-xs text-gray-400 leading-none mt-0.5'>{sub}</div>
    )}
  </div>
);

const RelationCard = ({ title, subtitle, rel }) => (
  <StatCard title={title} subtitle={subtitle}>
    {rel ? (
      <div className='flex items-center gap-3 px-3 py-3'>
        <UserAvatar
          player={rel.player}
          resetShadow
          resetRounding
          textClassName='text-[5px]'
          className='h-10 w-10 shrink-0 border rounded'
        />
        <div className='flex-1 min-w-0'>
          <div className='truncate text-sm font-medium text-gray-800'>
            {rel.player.name}
          </div>
          <div className='text-xs text-gray-400'>{rel.games} together</div>
        </div>
        <Value
          value={`${rel.wins}–${rel.losses}`}
          sub={fmtPct(rel.games ? rel.wins / rel.games : 0)}
        />
      </div>
    ) : (
      <Empty />
    )}
  </StatCard>
);

const streakLabel = ({ winStreak, lossStreak }) =>
  winStreak > 0 ? `W${winStreak}` : lossStreak > 0 ? `L${lossStreak}` : '—';

const PlayerStatsPage = ({ playerId, currentSeasonOnly, bySeries }) => {
  const { data, isLoading, error } = usePave({
    query: {
      player: {
        $: { id: playerId },
        ...avatarPlayerQ,
        stats: { $: { currentSeasonOnly, bySeries }, ...playerStatsFields }
      }
    }
  });

  const player = data?.player;

  if (isLoading || (!player && !error)) return <LoadingArea />;
  if (error) return <Notice>{error}</Notice>;
  if (!player) return <Notice>Player not found</Notice>;

  const s = player.stats;
  if (!s) return <Empty />;

  const unit = bySeries ? 'series' : 'games';
  const diffAccent =
    s.pointDiff > 0
      ? 'text-green-600'
      : s.pointDiff < 0
        ? 'text-red-500'
        : 'text-gray-900';

  return (
    <div className='space-y-6'>
      <div className='rounded-xl overflow-hidden border bg-gray-900 text-white shadow-sm'>
        <div className='flex items-center gap-4 p-4 sm:p-6'>
          <UserAvatar
            player={player}
            showItems
            className='h-24 w-24 sm:h-28 sm:w-28 shrink-0'
          />
          <div className='min-w-0'>
            <div className='text-2xl sm:text-3xl font-bold truncate'>
              {player.name}
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-300 mt-0.5'>
              <span>{s.rank ? titleize(s.rank) : 'Unranked'}</span>
              <span className='text-gray-500'>&middot;</span>
              <span>{s.elo} Elo</span>
            </div>
            <div className='mt-1 text-lg font-semibold'>
              {s.wins}&ndash;{s.losses}{' '}
              <span className='text-gray-400 text-sm font-normal'>
                ({fmtPct(s.winRate)} win)
              </span>
            </div>
          </div>
        </div>
        <div className='grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 bg-black/20 text-center'>
          <HeroStat label='Wins' value={s.wins} />
          <HeroStat label='Losses' value={s.losses} />
          <HeroStat label='Win %' value={fmtPct(s.winRate)} />
          <HeroStat label='Streak' value={streakLabel(s)} />
        </div>
      </div>

      <div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2'>
          Scoring
        </h2>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          <StatTile label='Points For' value={s.pointsFor} />
          <StatTile label='Points Against' value={s.pointsAgainst} />
          <StatTile
            label='Avg For / Against'
            value={`${s.avgPointsFor.toFixed(1)} / ${s.avgPointsAgainst.toFixed(1)}`}
          />
          <StatTile
            label='Point Diff'
            value={`${s.pointDiff > 0 ? '+' : ''}${s.pointDiff}`}
            accent={diffAccent}
          />
        </div>
      </div>

      <div>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2'>
          Streaks &amp; Dominance
        </h2>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
          <StatTile label={`Longest W (${unit})`} value={s.longestWinStreak} />
          <StatTile label={`Longest L (${unit})`} value={s.longestLossStreak} />
          <StatTile label='Skunks Dealt' value={s.skunksDelivered} />
          <StatTile label='Times Skunked' value={s.timesSkunked} />
          <StatTile label='Sweeps Dealt' value={s.sweepsDelivered} />
          <StatTile label='Times Swept' value={s.timesSwept} />
        </div>
      </div>

      <Section title='Around the League'>
        <RelationCard
          title='Best Partner'
          subtitle='Most wins alongside'
          rel={s.bestPartner}
        />
        <RelationCard
          title='Nemesis'
          subtitle='Lost to them the most'
          rel={s.nemesis}
        />
        <RelationCard
          title='Favorite Victim'
          subtitle='Beaten them the most'
          rel={s.victim}
        />
      </Section>

      <div className='space-y-2'>
        <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
          Recent Games
        </h2>
        <StatCard
          title='Game Log'
          subtitle={`Last ${s.recentResults.length} series`}
        >
          {s.recentResults.length ? (
            s.recentResults.map((g, i) => (
              <div
                key={i}
                className='flex items-center gap-3 border-t px-3 py-2'
              >
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 text-white',
                    g.won ? 'bg-green-500' : 'bg-red-500'
                  )}
                >
                  {g.won ? 'W' : 'L'}
                </div>
                <div className='flex -space-x-2 shrink-0'>
                  {g.opponents.map(p => (
                    <UserAvatar
                      key={p.id}
                      player={p}
                      resetShadow
                      resetRounding
                      textClassName='text-[5px]'
                      className='h-7 w-7 border rounded ring-2 ring-white'
                    />
                  ))}
                </div>
                <div className='flex-1 min-w-0 truncate text-sm text-gray-700'>
                  vs {g.opponents.map(p => p.name).join(' & ')}
                </div>
                <Value
                  value={`${g.myGames}–${g.oppGames}`}
                  sub={formatDate(g.completedAt)}
                />
              </div>
            ))
          ) : (
            <Empty />
          )}
        </StatCard>
      </div>
    </div>
  );
};

const StatsBoard = ({ currentSeasonOnly, bySeries }) => {
  const { data, isLoading, error } = usePave({
    query: { stats: { $: { currentSeasonOnly, bySeries }, ...statsFields } }
  });

  const stats = data?.stats;

  if (isLoading || (!stats && !error)) return <LoadingArea />;
  if (error) return <Notice>{error}</Notice>;
  if (!stats) return null;

  // Labels shift between game- and series-based framing.
  const unit = bySeries ? 'series' : 'games';
  const gp = bySeries ? 'SP' : 'GP';
  const playerMin = `min. ${stats.minPlayerGames} ${unit}`;
  const teamMin = `min. ${stats.minTeamGames} ${unit}`;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-3 gap-3'>
        <Total label='Games' value={stats.totals.games} />
        <Total label='Series' value={stats.totals.series} />
        <Total
          label={bySeries ? 'Sweeps' : 'Skunks'}
          value={stats.totals.skunks}
        />
      </div>

      <Section title='Highlights'>
        <HighlightCard
          title={bySeries ? 'Most Recent Sweep' : 'Most Recent Skunk'}
          subtitle={
            bySeries
              ? 'Latest whitewash, no games lost'
              : 'Latest 11–0 beatdown'
          }
          game={stats.highlights.mostRecentSkunk}
        />
        <HighlightCard
          title={bySeries ? 'Highest-Scoring Series' : 'Highest-Scoring Game'}
          subtitle='Most combined points'
          game={stats.highlights.highestScoringGame}
        />
      </Section>

      <Section title='Players'>
        {playerCard({
          title: 'Most Wins',
          subtitle: 'Allegedly on skill',
          items: stats.players.mostWins,
          value: ({ wins }) => wins,
          sub: ({ games }) => `${games} ${gp}`
        })}
        {playerCard({
          title: 'Most Losses',
          subtitle: 'Someone has to hold the L',
          items: stats.players.mostLosses,
          value: ({ losses }) => losses,
          sub: ({ games }) => `${games} ${gp}`
        })}
        {playerCard({
          title: 'Best Win %',
          subtitle: `Winners, statistically · ${playerMin}`,
          items: stats.players.bestWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
        {playerCard({
          title: bySeries ? 'Most Series Played' : 'Most Games Played',
          subtitle: 'Grass? Never touched it',
          items: stats.players.mostGamesPlayed,
          value: ({ games }) => games,
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
        {playerCard({
          title: 'Longest Win Streak',
          subtitle: 'Peaked, then remembered mortality',
          items: stats.players.longestWinStreak,
          value: ({ streak }) => streak
        })}
        {playerCard({
          title: bySeries ? 'Most Sweeps Delivered' : 'Most Skunks Delivered',
          subtitle: 'No mercy on the menu',
          items: stats.players.mostSkunksDelivered,
          value: ({ count }) => count
        })}
        {playerCard({
          title: bySeries ? 'Most Swept' : 'Most Skunked',
          subtitle: 'Points are optional, apparently',
          items: stats.players.mostSkunked,
          value: ({ count }) => count
        })}
      </Section>

      <Section title='Teams'>
        {teamCard({
          title: 'Won Most Together',
          subtitle: 'Chemistry, or dumb luck',
          items: stats.teams.mostWins,
          value: ({ wins }) => wins,
          sub: ({ games }) => `${games} ${gp}`
        })}
        {teamCard({
          title: 'Lost Most Together',
          subtitle: 'Misery loves a partner',
          items: stats.teams.mostLosses,
          value: ({ losses }) => losses,
          sub: ({ games }) => `${games} ${gp}`
        })}
        {teamCard({
          title: 'Best Duo Win %',
          subtitle: `Actual synergy · ${teamMin}`,
          items: stats.teams.bestWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
        {teamCard({
          title: 'Worst Duo Win %',
          subtitle: `Maybe see other people · ${teamMin}`,
          items: stats.teams.worstWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
      </Section>
    </div>
  );
};

export default () => {
  const [currentSeasonOnly, setCurrentSeasonOnly] = useState(true);
  const [bySeries, setBySeries] = useState(true);
  const [playerId, setPlayerId] = useState(null);

  const { data: playersData } = usePave({
    query: {
      players: {
        $: { activeOnly: false, size: 100, sortBy: { field: 'points' } },
        id: {},
        name: {}
      }
    }
  });
  const players = [...(playersData?.players ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-2xl font-bold text-gray-800'>Stats</h1>
        <div className='flex items-center gap-2 flex-wrap'>
          <select
            value={playerId ?? ''}
            onchange={e => setPlayerId(e.target.value || null)}
            className='px-2 py-1 border rounded text-xs bg-white cursor-pointer max-w-[10rem]'
          >
            <option value=''>League Overview</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className='flex'>
            <div
              className={clsx(
                'px-2 py-1 border text-xs rounded-l cursor-pointer hover:bg-gray-50',
                !bySeries && 'shadow-inner'
              )}
              onclick={() => setBySeries(false)}
            >
              By Game
            </div>
            <div
              className={clsx(
                'px-2 py-1 border-y border-r text-xs rounded-r cursor-pointer hover:bg-gray-50',
                bySeries && 'shadow-inner'
              )}
              onclick={() => setBySeries(true)}
            >
              By Series
            </div>
          </div>
          <div className='flex'>
            <div
              className={clsx(
                'px-2 py-1 border text-xs rounded-l cursor-pointer hover:bg-gray-50',
                !currentSeasonOnly && 'shadow-inner'
              )}
              onclick={() => setCurrentSeasonOnly(false)}
            >
              All-Time
            </div>
            <div
              className={clsx(
                'px-2 py-1 border-y border-r text-xs rounded-r cursor-pointer hover:bg-gray-50',
                currentSeasonOnly && 'shadow-inner'
              )}
              onclick={() => setCurrentSeasonOnly(true)}
            >
              This Season
            </div>
          </div>
        </div>
      </div>
      {playerId ? (
        <PlayerStatsPage
          key={`${playerId}:${currentSeasonOnly ? 'season' : 'all'}:${bySeries ? 'series' : 'game'}`}
          playerId={playerId}
          currentSeasonOnly={currentSeasonOnly}
          bySeries={bySeries}
        />
      ) : (
        <StatsBoard
          key={`${currentSeasonOnly ? 'season' : 'all'}:${bySeries ? 'series' : 'game'}`}
          currentSeasonOnly={currentSeasonOnly}
          bySeries={bySeries}
        />
      )}
    </div>
  );
};
