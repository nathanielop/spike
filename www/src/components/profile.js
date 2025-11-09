import clsx from 'clsx';
import { useState } from 'endr';

import ClaimDailyRewardOverlay from '#src/components/claim-daily-reward-overlay.js';
import BackpackIcon from '#src/components/icons/backpack.js';
import ChevronRightIcon from '#src/components/icons/chevron-right.js';
import CircleCheckIcon from '#src/components/icons/circle-check.js';
import CrosshairIcon from '#src/components/icons/crosshair.js';
import LogOutIcon from '#src/components/icons/log-out.js';
import ReceiptIcon from '#src/components/icons/receipt.js';
import SettingsIcon from '#src/components/icons/settings.js';
import SquareCheckIcon from '#src/components/icons/square-check.js';
import SquarePenIcon from '#src/components/icons/square-pen.js';
import SquareIcon from '#src/components/icons/square.js';
import StoreIcon from '#src/components/icons/store.js';
import SwordsIcon from '#src/components/icons/swords.js';
import TabletIcon from '#src/components/icons/tablet.js';
import Input from '#src/components/input.js';
import ItemPreview from '#src/components/item-preview.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import PlaceBetOverlay from '#src/components/place-bet-overlay.js';
import PlaceBountyOverlay from '#src/components/place-bounty-overlay.js';
import StoreOverlay from '#src/components/store-overlay.js';
import Tooltip from '#src/components/tooltip.js';
import UserAvatar from '#src/components/user-avatar.js';
import disk from '#src/constants/disk.js';
import history from '#src/constants/history.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import formatNumberWithUnit from '#src/functions/format-number-with-unit.js';
import formatNumber from '#src/functions/format-number.js';
import titleize from '#src/functions/titleize.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';
import useRootContext from '#src/hooks/use-root-context.js';
import useToggle from '#src/hooks/use-toggle.js';

const { window } = globalThis;

const tabs = [
  { name: 'results', Icon: SwordsIcon },
  { name: 'bets', Icon: ReceiptIcon },
  { name: 'inventory', Icon: BackpackIcon },
  { name: 'settings', Icon: SettingsIcon }
];

const Result = ({ player, series }) => {
  const [isOpen, , , toggle] = useToggle();
  const { games, teams } = series;

  const [playerTeam, opposingTeam] = teams.sort(a =>
    a.players.some(({ id }) => id === player.id) ? -1 : 1
  );

  const {
    [playerTeam.id]: gamesByPlayerTeam = [],
    [opposingTeam.id]: gamesByOpposingTeam = []
  } = games.reduce((obj, game) => {
    const winnerIds = game.winners.map(({ id }) => id);
    const teamId = teams.find(({ players }) =>
      players.every(({ id }) => winnerIds.includes(id))
    ).id;
    return { ...obj, [teamId]: [...(obj[teamId] ?? []), game] };
  }, {});

  return (
    <div className='border-t' key={series.id}>
      <div
        className={clsx(
          'grid grid-cols-4 group',
          isOpen && 'border-b',
          series.games.length && 'cursor-pointer hover:bg-gray-50'
        )}
        onclick={series.games.length > 0 ? toggle : undefined}
      >
        <div className='p-2 col-span-3 flex items-center gap-2'>
          <ChevronRightIcon
            className={clsx(
              'inline-block align-[-0.125rem] h-4 transition-[all] w-4',
              isOpen && 'rotate-90',
              !series.games.length && 'invisible'
            )}
          />
          <div
            className={clsx(
              'w-4 text-center font-bold',
              gamesByPlayerTeam.length > gamesByOpposingTeam.length
                ? 'text-green-500'
                : gamesByPlayerTeam.length !== gamesByOpposingTeam.length
                  ? 'text-red-500'
                  : 'text-gray-500'
            )}
          >
            {gamesByPlayerTeam.length > gamesByOpposingTeam.length
              ? 'W'
              : gamesByPlayerTeam.length !== gamesByOpposingTeam.length
                ? 'L'
                : '-'}
          </div>
          <div className='flex items-center gap-0.5'>
            <div className='flex gap-1'>
              {playerTeam.players.map(player => (
                <Tooltip key={player.id} tooltip={player.name}>
                  <UserAvatar
                    resetRounding
                    resetShadow
                    player={player}
                    className='h-6 w-6 rounded border'
                  />
                </Tooltip>
              ))}
            </div>
            <div
              className={clsx(
                'font-semibold w-5 text-center',
                gamesByPlayerTeam.length > gamesByOpposingTeam.length
                  ? 'text-green-500'
                  : gamesByPlayerTeam.length !== gamesByOpposingTeam.length
                    ? 'text-red-500'
                    : 'text-gray-500'
              )}
            >
              {gamesByPlayerTeam.length}
            </div>
          </div>
          <div>-</div>
          <div className='flex items-center gap-0.5'>
            <div
              className={clsx(
                'font-semibold w-5 text-center',
                gamesByPlayerTeam.length < gamesByOpposingTeam.length
                  ? 'text-green-500'
                  : gamesByPlayerTeam.length !== gamesByOpposingTeam.length
                    ? 'text-red-500'
                    : 'text-gray-500'
              )}
            >
              {gamesByOpposingTeam.length}
            </div>
            <div className='flex gap-1'>
              {opposingTeam.players.map(player => (
                <Tooltip key={player.id} tooltip={player.name}>
                  <UserAvatar
                    resetRounding
                    resetShadow
                    player={player}
                    className='h-6 w-6 rounded border'
                  />
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
        <div className='p-2 flex items-center'>
          {new Date(series.completedAt).toDateString()}
        </div>
      </div>
      {isOpen && (
        <div className='p-2 pl-14 space-y-2'>
          {series.games.map(game => {
            const winnerIds = game.winners.map(({ id }) => id);
            const [{ id: winningTeamId }] = teams.sort(a =>
              a.players.every(({ id }) => winnerIds.includes(id)) ? -1 : 1
            );
            return (
              <div key={game.id} className='flex items-center gap-2'>
                <div className='flex items-center gap-0.5'>
                  <div className='flex gap-1'>
                    {playerTeam.players.map(player => (
                      <Tooltip key={player.id} tooltip={player.name}>
                        <UserAvatar
                          resetRounding
                          resetShadow
                          player={player}
                          className='h-6 w-6 rounded border'
                        />
                      </Tooltip>
                    ))}
                  </div>
                  <div
                    className={clsx(
                      'font-semibold w-5 text-center',
                      winningTeamId === playerTeam.id
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {winningTeamId === playerTeam.id
                      ? game.winningTeamScore
                      : game.losingTeamScore}
                  </div>
                </div>
                <div>-</div>
                <div className='flex items-center gap-0.5'>
                  <div
                    className={clsx(
                      'font-semibold w-5 text-center',
                      winningTeamId !== playerTeam.id
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {winningTeamId !== playerTeam.id
                      ? game.winningTeamScore
                      : game.losingTeamScore}
                  </div>
                  <div className='flex gap-1'>
                    {opposingTeam.players.map(player => (
                      <Tooltip key={player.id} tooltip={player.name}>
                        <UserAvatar
                          resetRounding
                          resetShadow
                          player={player}
                          className='h-6 w-6 rounded border'
                        />
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ({ reload }) => {
  const {
    player,
    location: { query: { bet, seriesId } = {} },
    season
  } = useRootContext();
  const [tab, setTab] = useState(tabs[0].name);
  const [leaderboardTab, setLeaderboardTab] = useState('season');
  const [storeIsOpen, openStore, closeStore] = useToggle();
  const [placingBountyOnPlayer, setPlacingBountyOnPlayer] = useState(undefined);

  const [details, setDetails] = useState({
    isActive: player.isActive,
    name: player.name,
    nickname: player.nickname
  });

  const {
    data: profileData,
    error: profileDataError,
    isLoading: profileDataIsLoading,
    execute: reloadProfileData
  } = usePave({
    query: {
      players: {
        $: { sortBy: { field: 'points' } },
        id: {},
        name: {},
        avatarUrl: {},
        points: {}
      },
      allTimePlayers: {
        _: 'players',
        $: { sortBy: { field: 'elo' } },
        id: {},
        name: {},
        avatarUrl: {},
        elo: {},
        rank: {}
      },
      moneyPlayers: {
        _: 'players',
        $: { activeOnly: false, sortBy: { field: 'credits' } },
        id: {},
        name: {},
        credits: {},
        avatarUrl: {}
      },
      bountyPlayers: {
        _: 'players',
        $: { activeOnly: false, sortBy: { field: 'totalBounties' } },
        id: {},
        name: {},
        totalBounties: {},
        avatarUrl: {}
      },
      player: {
        $: { id: player.id },
        dailyRewardLastClaimedAt: {},
        id: {},
        isActive: {},
        items: {
          item: {
            id: {},
            name: {},
            type: {},
            limitedTo: {},
            description: {},
            attributes: {}
          },
          isEquipped: {}
        },
        credits: {},
        name: {},
        points: {},
        avatarUrl: { $: { size: 200 } },
        stats: { wins: {}, losses: {}, winRate: {}, rank: {} },
        bets: {
          id: {},
          amount: {},
          isActive: {},
          paidOutAmount: {},
          payRate: {},
          createdAt: {}
        },
        series: {
          id: {},
          completedAt: {},
          bestOf: {},
          teams: { id: {}, players: { id: {}, name: {}, avatarUrl: {} } },
          games: {
            id: {},
            losers: { id: {} },
            losingTeamScore: {},
            winners: { id: {} },
            winningTeamScore: {}
          }
        }
      }
    }
  });

  const [dailyRewardIsOpen, , closeDailyReward] = useToggle(
    profileData &&
      (!profileData.player.dailyRewardLastClaimedAt ||
        new Date(profileData.player.dailyRewardLastClaimedAt) <
          new Date() - 60 * 60 * 24 * 1000)
  );

  const { execute, error } = useAsync(async () => {
    if (
      details.password?.trim() &&
      details.password !== details.passwordConfirmation
    ) {
      throw new Error('Passwords do not match');
    }

    await pave.execute({
      query: {
        updatePlayer: {
          $: {
            id: player.id,
            isActive: details.isActive,
            name: details.name,
            nickname: details.nickname,
            password: details.password?.trim() || null
          }
        }
      }
    });

    notificationsApi.add({
      type: 'success',
      children: 'Profile settings updated successfully.'
    });

    reloadProfileData();
    reload();
  });
  useNotification(error);

  const { execute: updateEquippedItems, error: updateEquippedItemsError } =
    useAsync(async item => {
      await pave.execute({
        query: {
          updatePlayer: {
            $: {
              id: player.id,
              equippedItemIds: profileData.player.items.flatMap(
                ({ item: { id, type }, isEquipped }) => {
                  if (id === item.id) return !isEquipped ? id : [];
                  return isEquipped && type !== item.type ? id : [];
                }
              )
            }
          }
        }
      });
      reloadProfileData();
    });
  useNotification(updateEquippedItemsError);

  if (!profileData && profileDataIsLoading) {
    return <LoadingArea className='absolute inset-0' />;
  }

  return (
    <div className='p-8 gap-4 flex grow flex-col w-screen h-screen overflow-y-auto'>
      {dailyRewardIsOpen && (
        <ClaimDailyRewardOverlay
          onClose={closeDailyReward}
          onClaimed={reloadProfileData}
        />
      )}
      {placingBountyOnPlayer && (
        <PlaceBountyOverlay
          onClose={() => setPlacingBountyOnPlayer(undefined)}
          onPlaced={reloadProfileData}
          placingOnPlayer={placingBountyOnPlayer}
        />
      )}
      {profileDataError && <Notice>{profileDataError}</Notice>}
      {profileData && (
        <>
          <div className='flex flex-wrap gap-4 grow'>
            <div className='flex flex-col gap-4 grow max-w-prose'>
              {bet && (
                <PlaceBetOverlay
                  seriesId={seriesId}
                  onPlaced={reloadProfileData}
                  onClose={() => history.replace('/profile')}
                />
              )}
              {storeIsOpen && (
                <StoreOverlay
                  onPurchase={reloadProfileData}
                  onClose={closeStore}
                />
              )}
              <div className='text-3xl font-bold'>Profile</div>
              <div className='flex items-end justify-between'>
                <div className='relative'>
                  <UserAvatar
                    player={profileData.player}
                    className='h-32 w-32'
                  />
                  <a
                    href='https://gravatar.com/profile'
                    className='absolute -top-2 -right-2 z-10 bg-white rounded border hover:bg-gray-50 p-2'
                  >
                    <SquarePenIcon className='h-3 w-3' />
                  </a>
                </div>
                <div className='font-medium text-orange-500'>
                  {formatNumberWithUnit(profileData.player.credits, 1)} credits
                  available
                </div>
              </div>
              <div className='border leading-tight rounded w-full flex divide-x'>
                <div className='text-center p-2 w-full'>
                  <div>Wins</div>
                  <div className='text-xl font-semibold'>
                    {profileData.player.stats.wins}
                  </div>
                </div>
                <div className='text-center p-2 w-full'>
                  <div>Losses</div>
                  <div className='text-xl font-semibold'>
                    {profileData.player.stats.losses}
                  </div>
                </div>
                <div className='text-center p-2 w-full'>
                  <div>Win Rate</div>
                  <div className='text-xl font-semibold'>
                    {Math.round(profileData.player.stats.winRate * 100)}%
                  </div>
                </div>
                <div className='text-center p-2 w-full'>
                  <div>Rank</div>
                  <div className='text-xl font-semibold'>
                    {profileData.player.stats.rank
                      ? titleize(profileData.player.stats.rank)
                      : 'Unranked'}
                  </div>
                </div>
              </div>
              <div className='w-full flex'>
                {tabs.map(({ name, Icon }) => (
                  <div
                    key={name}
                    className={clsx(
                      'w-full p-2 flex md:flex-row flex-col items-center justify-center gap-0.5 border-t first:rounded-l last:rounded-r border-b-2 first:border-l border-r cursor-pointer hover:bg-gray-50',
                      tab === name && 'border-b-orange-500'
                    )}
                    onclick={() => setTab(name)}
                  >
                    <Icon className='h-4' />
                    <div>{titleize(name)}</div>
                  </div>
                ))}
              </div>
              {tab === 'results' ? (
                <div className='border rounded w-full'>
                  <div className='grid grid-cols-4'>
                    <div className='p-2 col-span-3'>Result</div>
                    <div className='p-2'>Played On</div>
                  </div>
                  {!profileData.player.series.length && (
                    <div className='px-4 py-12 text-center w-full border-t'>
                      No games played yet
                    </div>
                  )}
                  {profileData.player.series.map(series => (
                    <Result key={series.id} series={series} player={player} />
                  ))}
                </div>
              ) : tab === 'inventory' ? (
                <div>
                  {profileData.player.items.length ? (
                    <div className='grid grid-cols-4 gap-4 overflow-y-auto'>
                      {profileData.player.items.map(({ item, isEquipped }) => (
                        <div
                          key={item.id}
                          className='relative cursor-pointer hover:border-orange-500 transition w-full border rounded aspect-square p-2'
                          onclick={() => updateEquippedItems(item)}
                        >
                          <ItemPreview item={item} />
                          {isEquipped ? (
                            <SquareCheckIcon className='absolute h-4 w-4 top-2 right-2' />
                          ) : (
                            <SquareIcon className='absolute h-4 w-4 top-2 right-2' />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='w-full p-8 space-y-1 flex flex-col justify-center items-center border rounded'>
                      <div>You don&apos;t own any items yet</div>
                      <a
                        onclick={openStore}
                        className='block cursor-pointer text-sm text-orange-500 hover:text-orange-600'
                      >
                        View Store
                      </a>
                    </div>
                  )}
                </div>
              ) : tab === 'bets' ? (
                <div className='border rounded w-full'>
                  <div className='grid grid-cols-4'>
                    <div className='p-2'>Amount</div>
                    <div className='p-2'>Paid Out Amount</div>
                    <div className='p-2 text-center'>Final</div>
                    <div className='p-2'>Placed On</div>
                  </div>
                  {!profileData.player.bets.length && (
                    <div className='px-4 py-12 text-center w-full border-t'>
                      No bets placed yet
                    </div>
                  )}
                  {profileData.player.bets.map(bet => (
                    <div className='border-t grid grid-cols-4' key={bet.id}>
                      <div className='p-2'>
                        {formatNumberWithUnit(bet.amount)}
                      </div>
                      <div className='p-2'>
                        {bet.paidOutAmount
                          ? formatNumberWithUnit(bet.paidOutAmount)
                          : '-'}
                      </div>
                      <div className='p-2 text-center'>
                        {!bet.isActive && (
                          <CircleCheckIcon className='inline-block align-[-0.125rem] h-5 text-green-500' />
                        )}
                      </div>
                      <div className='flex'>
                        <div className='p-2'>
                          {new Date(bet.createdAt).toDateString()}
                        </div>
                        {/* TODO Add delete button, need a flag in API to indicate if can be deleted */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form
                  autocomplete='off'
                  onsubmit={ev => {
                    ev.preventDefault();
                    execute();
                  }}
                  className='border rounded p-4 text-center space-y-4 w-full'
                >
                  <Input
                    placeholder='Name'
                    required
                    className='w-full'
                    autocomplete='spikeball-name'
                    value={details.name ?? ''}
                    onchange={({ target: { value } }) =>
                      setDetails(prev => ({ ...prev, name: value }))
                    }
                  />
                  <Input
                    placeholder='Nickname'
                    className='w-full'
                    autocomplete='spikeball-nickname'
                    value={details.nickname ?? ''}
                    onchange={({ target: { value } }) =>
                      setDetails(prev => ({ ...prev, nickname: value }))
                    }
                  />
                  <Input
                    placeholder='Password'
                    className='w-full'
                    autocomplete='spikeball-password'
                    value={details.password ?? ''}
                    type='password'
                    onchange={({ target: { value } }) =>
                      setDetails(prev => ({ ...prev, password: value }))
                    }
                  />
                  <Input
                    placeholder='Confirm Password'
                    className='w-full'
                    autocomplete='spikeball-password-confirmation'
                    value={details.passwordConfirmation ?? ''}
                    type='password'
                    onchange={({ target: { value } }) =>
                      setDetails(prev => ({
                        ...prev,
                        passwordConfirmation: value
                      }))
                    }
                  />
                  <label className='relative flex items-center gap-1'>
                    {details.isActive ? <SquareCheckIcon /> : <SquareIcon />}
                    <div>Active</div>
                    <input
                      className='absolute inset-0 cursor-pointer'
                      type='checkbox'
                      checked={details.isActive}
                      onchange={({ target: { checked } }) =>
                        setDetails(prev => ({ ...prev, isActive: checked }))
                      }
                    />
                  </label>
                  <button
                    type='submit'
                    className='bg-orange-500 hover:bg-orange-600 text-center transition-colors text-white rounded p-2 w-full'
                  >
                    Update
                  </button>
                </form>
              )}
            </div>
            <div className='grow max-w-prose'>
              <div className='space-y-2'>
                <div className='flex items-center gap-x-2 flex-wrap justify-between'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <div className='text-2xl font-bold'>Leaderboard</div>
                      <div className='flex'>
                        <div
                          className={clsx(
                            'px-2 py-1 border-y border text-xs rounded-l cursor-pointer hover:bg-gray-50',
                            leaderboardTab === 'season' && 'shadow-inner'
                          )}
                          onclick={() => setLeaderboardTab('season')}
                        >
                          Season
                        </div>
                        <div
                          className={clsx(
                            'px-2 py-1 border-y border-r text-xs cursor-pointer hover:bg-gray-50',
                            leaderboardTab === 'allTime' && 'shadow-inner'
                          )}
                          onclick={() => setLeaderboardTab('allTime')}
                        >
                          All-Time
                        </div>
                        <div
                          className={clsx(
                            'px-2 py-1 border-y text-xs cursor-pointer hover:bg-gray-50',
                            leaderboardTab === 'money' && 'shadow-inner'
                          )}
                          onclick={() => setLeaderboardTab('money')}
                        >
                          Money
                        </div>
                        <div
                          className={clsx(
                            'px-2 py-1 border-y border-x text-xs rounded-r cursor-pointer hover:bg-gray-50',
                            leaderboardTab === 'bounties' && 'shadow-inner'
                          )}
                          onclick={() => setLeaderboardTab('bounties')}
                        >
                          Bounties
                        </div>
                      </div>
                    </div>
                    {leaderboardTab === 'season' && (
                      <div className='font-light text-sm whitespace-nowrap'>
                        Ends {new Date(season.endsAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {leaderboardTab === 'season' && (
                    <div className='font-medium text-orange-500 text-right whitespace-nowrap'>
                      {formatNumber(profileData.player.points)} points
                    </div>
                  )}
                </div>
                <div className='border rounded w-full'>
                  <div className='grid grid-cols-4 font-semibold'>
                    <div className='p-2 col-span-3'>Player</div>
                    <div className='p-2 text-right'>
                      {leaderboardTab === 'allTime'
                        ? 'Rank'
                        : leaderboardTab === 'money'
                          ? 'Credits'
                          : leaderboardTab === 'bounties'
                            ? 'Total Bounty'
                            : 'Points'}
                    </div>
                  </div>
                  {(leaderboardTab === 'season'
                    ? profileData.players
                    : leaderboardTab === 'money'
                      ? profileData.moneyPlayers
                      : leaderboardTab === 'allTime'
                        ? profileData.allTimePlayers
                        : profileData.bountyPlayers
                  ).map((player, i) => (
                    <div
                      className='border-t group grid grid-cols-4'
                      key={`${leaderboardTab}:${player.id}`}
                    >
                      <div className='p-2 flex items-center gap-2 col-span-3'>
                        <UserAvatar
                          player={player}
                          resetShadow
                          resetRounding
                          textClassName='text-[5px]'
                          className='border rounded h-6 w-6'
                        />
                        <div
                          className={clsx(
                            player.id === profileData.player.id &&
                              'font-semibold'
                          )}
                        >
                          {player.name}
                        </div>
                        {player.id !== profileData.player.id &&
                          tab !== 'bounties' && (
                            <a
                              onclick={() => setPlacingBountyOnPlayer(player)}
                              className='block group-hover:visible invisible cursor-pointer text-orange-500 hover:text-orange-600'
                            >
                              <CrosshairIcon className='h-4 inline-block text-orange-500 align-[-0.125rem]' />{' '}
                              Place Bounty
                            </a>
                          )}
                      </div>
                      <div className='p-2 text-right'>
                        <Tooltip
                          tooltip={
                            leaderboardTab === 'allTime'
                              ? `${formatNumber(player.elo)} - ${player.rank ? titleize(player.rank) : 'Unranked'}`
                              : undefined
                          }
                        >
                          {leaderboardTab === 'season' ? (
                            <>
                              {i === 0
                                ? '🥇 '
                                : i === 1
                                  ? '🥈 '
                                  : i === 2
                                    ? '🥉 '
                                    : ''}
                              {formatNumber(player.points)}
                            </>
                          ) : leaderboardTab === 'money' ? (
                            formatNumberWithUnit(player.credits)
                          ) : leaderboardTab === 'bounties' ? (
                            formatNumberWithUnit(player.totalBounties)
                          ) : player.rank ? (
                            titleize(player.rank)
                          ) : (
                            'Unranked'
                          )}
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {player.isAdmin && (
            <a
              href='/'
              className='block cursor-pointer text-orange-500 hover:text-orange-600'
            >
              <TabletIcon className='h-4 inline-block text-orange-500 align-[-0.125rem]' />{' '}
              Enter Tablet Mode
            </a>
          )}
          <a
            onclick={openStore}
            className='block cursor-pointer text-orange-500 hover:text-orange-600'
          >
            <StoreIcon className='h-4 inline-block text-orange-500 align-[-0.125rem]' />{' '}
            View Store
          </a>
          <a
            onclick={() => {
              disk.set('grantKey', null);
              disk.set('paveCache', null);
              window.location.reload();
            }}
            className='block cursor-pointer text-orange-500 hover:text-orange-600'
          >
            <LogOutIcon className='h-4 inline-block text-orange-500 align-[-0.125rem]' />{' '}
            Log Out
          </a>
        </>
      )}
    </div>
  );
};
