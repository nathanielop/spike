import clsx from 'clsx';
import { useState } from 'endr';

import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import UserAvatar from '#src/components/user-avatar.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';
import useRootContext from '#src/hooks/use-root-context.js';

const { confirm } = globalThis;

export default ({ onClose, onPurchase }) => {
  const { player } = useRootContext();
  const [cart, setCart] = useState([]);

  const cartTotal = cart.reduce(
    (total, { price, discountedPrice }) => total + (discountedPrice ?? price),
    0
  );

  const {
    data: itemsData,
    error: itemsError,
    isLoading: itemsAreLoading
  } = usePave({
    query: {
      items: {
        attributes: {},
        description: {},
        discountedPrice: {},
        id: {},
        limitedTo: {},
        name: {},
        price: {}
      }
    }
  });

  const items = itemsData?.items ?? [];

  const {
    execute: purchase,
    error: purchaseError,
    isLoading: purchaseIsLoading
  } = useAsync(async () => {
    // await pave.execute({
    //   query: {
    //     createBet: {
    //       $: { amount: betDetails.amount, teamId: betDetails.team?.id },
    //       ...rootContextQuery
    //     }
    //   }
    // });

    notificationsApi.add({
      type: 'success',
      children: 'Item purchased successfully.'
    });

    onPurchase();
    onClose();
  });
  useNotification(purchaseError);

  return (
    <div className='fixed inset-0 p-8 bg-gray-900 bg-opacity-50 z-50 animate-slideInUp'>
      <div className='relative bg-white p-8 h-full w-full flex flex-col gap-4 rounded-lg shadow-lg'>
        <button
          onclick={onClose}
          className='absolute leading-none top-2 right-2 text-3xl'
        >
          &times;
        </button>
        <h2 className='text-xl font-semibold'>Store</h2>
        <div className='flex md:flex-row flex-col grow justify-center items-center gap-4'>
          {itemsError && <Notice>{itemsError}</Notice>}
          {itemsAreLoading && <LoadingArea />}
          {itemsData && (
            <>
              {!items.length && (
                <div>
                  There are currently no items available, please check back
                  later!
                </div>
              )}
            </>
          )}
        </div>
        <button
          className='bg-green-500 text-white py-2 px-4 cursor-pointer rounded ml-auto hover:bg-green-700 transition'
          disabled={
            !cart.length || cartTotal > player.credits || purchaseIsLoading
          }
          onclick={() => {
            if (
              confirm(
                `Are you sure you want to purchase these items for ${cartTotal} credits?`
              )
            ) {
              purchase();
            }
          }}
        >
          Purchase Items
        </button>
      </div>
    </div>
  );
};
