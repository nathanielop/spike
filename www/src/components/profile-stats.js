import clsx from 'clsx';
import { useState } from 'endr';
import { DateTime } from 'luxon';

import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import UserAvatar from '#src/components/user-avatar.js';
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

const StatsBoard = ({ currentSeasonOnly }) => {
  const { data, isLoading, error } = usePave({
    query: { stats: { $: { currentSeasonOnly }, ...statsFields } }
  });

  const stats = data?.stats;

  if (isLoading || (!stats && !error)) return <LoadingArea />;
  if (error) return <Notice>{error}</Notice>;
  if (!stats) return null;

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-3 gap-3'>
        <Total label='Games' value={stats.totals.games} />
        <Total label='Series' value={stats.totals.series} />
        <Total label='Skunks' value={stats.totals.skunks} />
      </div>

      <Section title='Highlights'>
        <HighlightCard
          title='Most Recent Skunk'
          subtitle='Latest 11–0 beatdown'
          game={stats.highlights.mostRecentSkunk}
        />
        <HighlightCard
          title='Highest-Scoring Game'
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
          sub: ({ games }) => `${games} GP`
        })}
        {playerCard({
          title: 'Most Losses',
          subtitle: 'Someone has to hold the L',
          items: stats.players.mostLosses,
          value: ({ losses }) => losses,
          sub: ({ games }) => `${games} GP`
        })}
        {playerCard({
          title: 'Best Win %',
          subtitle: 'Winners, statistically · min. 10 games',
          items: stats.players.bestWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
        {playerCard({
          title: 'Most Games Played',
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
          title: 'Most Skunks Delivered',
          subtitle: 'No mercy on the menu',
          items: stats.players.mostSkunksDelivered,
          value: ({ count }) => count
        })}
        {playerCard({
          title: 'Most Skunked',
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
          sub: ({ games }) => `${games} GP`
        })}
        {teamCard({
          title: 'Lost Most Together',
          subtitle: 'Misery loves a partner',
          items: stats.teams.mostLosses,
          value: ({ losses }) => losses,
          sub: ({ games }) => `${games} GP`
        })}
        {teamCard({
          title: 'Best Duo Win %',
          subtitle: 'Actual synergy · min. 5 games',
          items: stats.teams.bestWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
        {teamCard({
          title: 'Worst Duo Win %',
          subtitle: 'Maybe see other people · min. 5 games',
          items: stats.teams.worstWinPct,
          value: ({ winPct }) => fmtPct(winPct),
          sub: ({ wins, losses }) => `${wins}–${losses}`
        })}
      </Section>
    </div>
  );
};

export default () => {
  const [currentSeasonOnly, setCurrentSeasonOnly] = useState(false);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <h1 className='text-2xl font-bold text-gray-800'>Stats</h1>
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
      <StatsBoard
        key={currentSeasonOnly ? 'season' : 'all'}
        currentSeasonOnly={currentSeasonOnly}
      />
    </div>
  );
};
