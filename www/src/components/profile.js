import clsx from 'clsx';
import { useState } from 'endr';

import BackpackIcon from '#src/components/icons/backpack.js';
import CircleCheckIcon from '#src/components/icons/circle-check.js';
import LogOutIcon from '#src/components/icons/log-out.js';
import ReceiptIcon from '#src/components/icons/receipt.js';
import SettingsIcon from '#src/components/icons/settings.js';
import SquarePenIcon from '#src/components/icons/square-pen.js';
import StoreIcon from '#src/components/icons/store.js';
import SwordsIcon from '#src/components/icons/swords.js';
import TabletIcon from '#src/components/icons/tablet.js';
import Input from '#src/components/input.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import PlaceBetOverlay from '#src/components/place-bet-overlay.js';
import StoreOverlay from '#src/components/store-overlay.js';
import UserAvatar from '#src/components/user-avatar.js';
import disk from '#src/constants/disk.js';
import history from '#src/constants/history.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
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

export default ({ reload }) => {
  const {
    player,
    location: { query: { bet, seriesId } = {} }
  } = useRootContext();
  const [tab, setTab] = useState(tabs[0].name);
  const [storeIsOpen, openStore, closeStore] = useToggle();

  const [details, setDetails] = useState({
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
      player: {
        $: { id: player.id },
        id: {},
        items: {
          item: {
            id: {},
            name: {},
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

  if (profileDataIsLoading) return <LoadingArea className='absolute inset-0' />;

  return (
    <div className='p-8 gap-4 flex grow flex-col w-screen h-screen overflow-y-auto'>
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
                  {profileData.player.credits} credits available
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
                    {titleize(profileData.player.stats.rank)}
                  </div>
                </div>
              </div>
              <div className='w-full flex'>
                {tabs.map(({ name, Icon }) => (
                  <div
                    key={name}
                    className={clsx(
                      'w-full p-2 text-center border-t first:rounded-l last:rounded-r border-b-2 first:border-l border-r cursor-pointer hover:bg-gray-50',
                      tab === name && 'border-b-orange-500'
                    )}
                    onclick={() => setTab(name)}
                  >
                    <Icon className='h-4 inline-block align-[-0.125rem]' />{' '}
                    {titleize(name)}
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
                  {profileData.player.series.map(series => {
                    // const gamesByWinnerIds = series.games.reduce(
                    //   (obj, game) => {
                    //     const ids = game.winners.map(({ id }) => id).join(':');
                    //     return { ...obj, [ids]: (obj[ids] ?? []).concat(game) };
                    //   },
                    //   {}
                    // );
                    // const winnerIds = Object.entries(gamesByWinnerIds).sort(
                    //   ([, a], [, b]) => b.length - a.length
                    // )[0];
                    // const [winnerId, games] = winnerIds;
                    return (
                      <div
                        className='border-t grid grid-cols-4'
                        key={series.id}
                      >
                        <div className='p-2 col-span-3'>
                          {/* {series.bestOf} */}-
                        </div>
                        <div className='p-2'>
                          {new Date(series.completedAt).toDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : tab === 'inventory' ? (
                <div>
                  {profileData.player.items.length ? (
                    <div />
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
                      <div className='p-2'>{bet.amount}</div>
                      <div className='p-2'>{bet.paidOutAmount ?? '-'}</div>
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
                  <button
                    type='submit'
                    className='bg-orange-500 hover:bg-orange-600 text-center transition-colors text-white rounded p-2 w-full'
                  >
                    Update
                  </button>
                </form>
              )}
            </div>
            <div className='space-y-4 grow max-w-prose'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 justify-between'>
                  <div className='text-2xl font-bold'>Season Leaderboard</div>
                  <div className='font-medium text-orange-500'>
                    {profileData.player.points} points
                  </div>
                </div>
                <div className='border rounded w-full'>
                  <div className='grid grid-cols-4'>
                    <div className='p-2 col-span-3'>Player</div>
                    <div className='p-2 text-right'>Points</div>
                  </div>
                  {profileData.players.map((player, i) => (
                    <div className='border-t grid grid-cols-4' key={player.id}>
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
                      </div>
                      <div className='p-2 text-right'>
                        {i === 0
                          ? '🥇 '
                          : i === 1
                            ? '🥈 '
                            : i === 2
                              ? '🥉 '
                              : ''}
                        {player.points}
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
