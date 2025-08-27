import { useState } from 'endr';

import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useRootContext from '#src/hooks/use-root-context.js';

const { confirm } = globalThis;

export default ({ onClose, placingOnPlayer }) => {
  const { player } = useRootContext();
  const [amount, setAmount] = useState(10);

  const { execute, error, isLoading } = useAsync(async () => {
    await pave.execute({
      query: {
        createBounty: {
          $: { amount, playerId: placingOnPlayer.id },
          ...rootContextQuery
        }
      }
    });
    notificationsApi.add({
      type: 'success',
      children: 'Bounty placed successfully.'
    });
    onClose();
  });
  useNotification(error);

  return (
    <div className='fixed inset-0 p-8 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 animate-slideInUp'>
      <div className='relative bg-white p-8 max-w-full flex flex-col gap-4 rounded-lg shadow-lg'>
        <button
          onclick={onClose}
          className='absolute leading-none top-2 right-2 text-3xl'
        >
          &times;
        </button>
        <h2 className='text-xl font-semibold'>
          Place Bounty on {placingOnPlayer.name}
        </h2>
        <div className='flex gap-2 w-full'>
          <input
            type='number'
            value={amount}
            placeholder='Enter bet amount...'
            oninput={e =>
              setAmount(Math.min(Math.round(e.target.value), player.credits))
            }
            className='p-2 border rounded w-full'
          />
          <div className='flex border divide-x shrink-0 rounded overflow-hidden'>
            {[10, 100, 500].map(amount => (
              <button
                key={amount}
                className='p-2 hover:bg-gray-100 shrink-0 transition-colors'
                onclick={() => setAmount(Math.min(amount, player.credits))}
              >
                {amount}
              </button>
            ))}
            <button
              className='p-2 hover:bg-gray-100 shrink-0 transition-colors'
              onclick={() => setAmount(player.credits)}
            >
              Max
            </button>
          </div>
        </div>
        <button
          className='bg-green-500 text-white p-2 rounded w-full hover:bg-green-700 transition cursor-pointer'
          disabled={!amount || isLoading}
          onclick={() => {
            if (
              confirm(
                `Are you sure you want to place this bounty for ${amount} credits?`
              )
            ) {
              execute();
            }
          }}
        >
          Place Bounty
        </button>
      </div>
    </div>
  );
};
