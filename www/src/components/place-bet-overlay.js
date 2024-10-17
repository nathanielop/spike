import clsx from 'clsx';
import { useState } from 'endr';

import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import UserAvatar from '#src/components/user-avatar.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';
import useRootContext from '#src/hooks/use-root-context.js';

const { confirm } = globalThis;

export default ({ onClose, onPlaced, seriesId }) => {
  const { player } = useRootContext();
  const [betDetails, setBetDetails] = useState({});

  const {
    data: seriesData,
    error: seriesError,
    isLoading: seriesIsLoading
  } = usePave({
    query: {
      series: {
        $: { id: seriesId },
        id: {},
        teams: {
          id: {},
          players: { id: {}, name: {}, avatarUrl: {} },
          odds: {}
        }
      }
    }
  });

  const series = seriesData?.series;

  const {
    execute: placeBet,
    error: placeBetError,
    isLoading: placeBetIsLoading
  } = useAsync(async () => {
    await pave.execute({
      query: {
        createBet: {
          $: { amount: betDetails.amount, teamId: betDetails.team?.id },
          ...rootContextQuery
        }
      }
    });
    onPlaced();
    onClose();
  });
  useNotification(placeBetError);

  return (
    <div className='absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 animate-slideInUp'>
      <div className='relative bg-white p-8 flex flex-col gap-4 rounded-lg shadow-lg'>
        <button
          onclick={onClose}
          className='absolute leading-none top-2 right-2 text-3xl'
        >
          &times;
        </button>
        <h2 className='text-xl font-semibold'>Place Bet</h2>
        <div className='flex items-center gap-4'>
          {seriesError && <Notice>{seriesError}</Notice>}
          {seriesIsLoading && <LoadingArea />}
          {seriesData && (
            <>
              <div
                onclick={() =>
                  setBetDetails(prev => ({
                    ...prev,
                    team: series.teams[0]
                  }))
                }
                className={clsx(
                  'relative flex p-4 hover:bg-gray-50 border-2 cursor-pointer rounded justify-between gap-2 w-full',
                  betDetails.team?.id === series.teams[0].id &&
                    'border-orange-500'
                )}
              >
                {series.teams[0].players.map(player => (
                  <UserAvatar
                    key={player.id}
                    player={player}
                    className='h-16 pointer-events-none'
                  />
                ))}
                <div className='absolute border -top-2 -right-2 bg-white rounded p-1 text-xs'>
                  {Math.round(series.teams[0].odds * 100)}%
                </div>
              </div>
              <div className='font-semibold text-gray-500 shrink-0 text-lg'>
                VS
              </div>
              <div
                onclick={() =>
                  setBetDetails(prev => ({
                    ...prev,
                    team: series.teams[1]
                  }))
                }
                className={clsx(
                  'relative flex p-4 hover:bg-gray-50 border-2 cursor-pointer rounded justify-between gap-2 w-full',
                  betDetails.team?.id === series.teams[1].id &&
                    'border-orange-500'
                )}
              >
                {series.teams[1].players.map(player => (
                  <UserAvatar
                    key={player.id}
                    player={player}
                    className='h-16 pointer-events-none'
                  />
                ))}
                <div className='absolute border -top-2 -left-2 bg-white rounded p-1 text-xs'>
                  {Math.round(series.teams[1].odds * 100)}%
                </div>
              </div>
            </>
          )}
        </div>
        <div className='flex gap-2 w-full'>
          <input
            type='number'
            value={betDetails.amount}
            placeholder='Enter bet amount...'
            onChange={e =>
              setBetDetails(prev => ({
                ...prev,
                amount: Math.min(Math.round(e.target.value), player.credits)
              }))
            }
            className='p-2 border rounded w-full'
          />
          <div className='flex border divide-x shrink-0 rounded overflow-hidden'>
            {[10, 100, 500].map(amount => (
              <button
                key={amount}
                className='p-2 hover:bg-gray-100 shrink-0 transition-colors'
                onclick={() =>
                  setBetDetails(prev => ({
                    ...prev,
                    amount: Math.min(amount, player.credits)
                  }))
                }
              >
                {amount}
              </button>
            ))}
            <button
              className='p-2 hover:bg-gray-100 shrink-0 transition-colors'
              onclick={() =>
                setBetDetails(prev => ({
                  ...prev,
                  amount: player.credits
                }))
              }
            >
              Max
            </button>
          </div>
        </div>
        <div className='border rounded flex items-center justify-between p-2 gap-2'>
          <div>Expected Payout</div>
          <div>
            {betDetails.amount && betDetails.team?.odds
              ? Math.round(betDetails.amount * (1 / betDetails.team.odds))
              : '-'}
          </div>
        </div>
        <button
          className='bg-green-500 text-white p-2 rounded w-full hover:bg-green-700 transition'
          disabled={!betDetails.amount || !betDetails.team || placeBetIsLoading}
          onclick={() => {
            if (
              confirm(
                `Are you sure you want to place this bet for ${betDetails.amount} credits?`
              )
            ) {
              placeBet();
            }
          }}
        >
          Place Bet
        </button>
      </div>
    </div>
  );
};
