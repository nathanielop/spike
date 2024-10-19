import { useState } from 'endr';

import CircleCheckIcon from '#src/components/icons/circle-check.js';
import LogOutIcon from '#src/components/icons/log-out.js';
import TabletIcon from '#src/components/icons/tablet.js';
import Input from '#src/components/input.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import PlaceBetOverlay from '#src/components/place-bet-overlay.js';
import UserAvatar from '#src/components/user-avatar.js';
import disk from '#src/constants/disk.js';
import history from '#src/constants/history.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import capitalize from '#src/functions/capitalize.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';
import useRootContext from '#src/hooks/use-root-context.js';

const { window } = globalThis;

export default ({ reload }) => {
  const {
    player,
    location: { query: { bet, seriesId } = {} }
  } = useRootContext();

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
      player: {
        $: { id: player.id },
        id: {},
        credits: {},
        name: {},
        avatarUrl: { $: { size: 200 } },
        stats: {
          wins: {},
          losses: {},
          winRate: {},
          rank: {}
        },
        bets: {
          id: {},
          amount: {},
          isActive: {},
          paidOutAmount: {},
          payRate: {},
          createdAt: {}
        }
        // games: {
        //   id: {},
        //   winningTeam
        //   teams: {
        //     id: {},
        //     players: { id: {}, name: {}, avatarUrl: {} },
        //     odds: {}
        //   }
        // }
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

    reload();
  });
  useNotification(error);

  return (
    <div className='p-8 gap-4 flex grow flex-col w-screen h-screen overflow-y-auto'>
      <div className='flex flex-wrap gap-4 grow'>
        <div className='flex flex-col gap-4 grow max-w-prose'>
          {bet && (
            <PlaceBetOverlay
              seriesId={seriesId}
              onPlaced={reloadProfileData}
              onClose={() => history.push('/profile')}
            />
          )}
          <div className='text-3xl font-bold'>Profile</div>
          <UserAvatar
            player={profileData?.player ?? player}
            className='h-32 w-32'
          />
          <a
            href='https://gravatar.com/profile'
            className='bg-white block hover:bg-gray-50 rounded border p-2 w-32 text-center'
          >
            Change
          </a>
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
                setDetails(prev => ({ ...prev, passwordConfirmation: value }))
              }
            />
            <button
              type='submit'
              className='bg-orange-500 hover:bg-orange-600 text-center transition-colors text-white rounded p-2 w-full'
            >
              Update
            </button>
          </form>
        </div>
        <div className='space-y-4 grow max-w-prose'>
          {profileDataError && <Notice>{profileDataError}</Notice>}
          {!profileData && profileDataIsLoading && (
            <LoadingArea className='h-full' />
          )}
          {profileData && (
            <>
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>Stats</div>
                <div className='border rounded w-full flex divide-x'>
                  <div className='text-center p-2 space-y-0.5 w-full'>
                    <div>Wins</div>
                    <div className='text-xl md:text-2xl font-semibold'>
                      {profileData.player.stats.wins}
                    </div>
                  </div>
                  <div className='text-center p-2 space-y-0.5 w-full'>
                    <div>Losses</div>
                    <div className='text-xl md:text-2xl font-semibold'>
                      {profileData.player.stats.losses}
                    </div>
                  </div>
                  <div className='text-center p-2 space-y-0.5 w-full'>
                    <div>Win Rate</div>
                    <div className='text-xl md:text-2xl font-semibold'>
                      {Math.round(profileData.player.stats.winRate * 100)}%
                    </div>
                  </div>
                  <div className='text-center p-2 space-y-0.5 w-full'>
                    <div>Rank</div>
                    <div className='text-xl md:text-2xl font-semibold'>
                      {capitalize(profileData.player.stats.rank)}
                    </div>
                  </div>
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 justify-between'>
                  <div className='text-2xl font-bold'>Bets</div>
                  <div className='font-medium text-orange-500'>
                    {profileData.player.credits} credits available
                  </div>
                </div>
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
                  {profileData.player.bets.slice(0, 10).map(bet => (
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
              </div>
              {/* <div className='space-y-2'>
                <div className='text-2xl font-bold'>Games</div>
                <div className='border rounded w-full'>
                  <div className='grid grid-cols-4'>
                    <div className='p-2'>Amount</div>
                    <div className='p-2'>Paid Out Amount</div>
                    <div className='p-2 text-center'>Final</div>
                    <div className='p-2'>Placed On</div>
                  </div>
                  {!profileData.recentGames.length && (
                    <div className='px-4 py-12 text-center w-full border-t'>
                      No games played yet
                    </div>
                  )}
                  {profileData.player.bets.slice(0, 10).map(bet => (
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
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </>
          )}
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
    </div>
  );
};
