import { useState } from 'endr';

import ArrowLeftIcon from '#src/components/icons/arrow-left.js';
import SquarePenIcon from '#src/components/icons/square-pen.js';
import Input from '#src/components/input.js';
import ItemPreview from '#src/components/item-preview.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import titleize from '#src/functions/titleize.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';
import useRootContext from '#src/hooks/use-root-context.js';

const omit = (obj, key) => {
  // eslint-disable-next-line no-unused-vars
  const { [key]: _, ...rest } = obj;
  return rest;
};

export default ({ onClose, onPurchase }) => {
  const { player } = useRootContext();
  const [cart, setCart] = useState([]);
  const [viewingItem, setViewingItem] = useState();
  const [newAttribute, setNewAttribute] = useState({});

  const addChange = diff => setViewingItem({ ...viewingItem, ...diff });

  const cartTotal = cart.reduce(
    (total, { price, discountedPrice }) => total + (discountedPrice ?? price),
    0
  );

  const {
    data: itemsData,
    error: itemsError,
    isLoading: itemsAreLoading,
    execute: reloadItems
  } = usePave({
    query: {
      items: {
        attributes: {},
        description: {},
        discountedPrice: {},
        id: {},
        limitedTo: {},
        name: {},
        price: {},
        type: {}
      }
    }
  });

  const items = itemsData?.items ?? [];

  const {
    execute,
    error: createOrUpdateError,
    isLoading: createOrUpdateIsLoading
  } = useAsync(async () => {
    const {
      attributes,
      description,
      discountedPrice,
      isForSale,
      limitedTo,
      name,
      price,
      type
    } = viewingItem;

    await pave.execute({
      query: {
        [viewingItem.id ? 'updateItem' : 'createItem']: {
          $: {
            ...(viewingItem.id && { id: viewingItem.id }),
            attributes,
            description,
            discountedPrice,
            isForSale,
            limitedTo,
            name,
            price,
            type
          }
        }
      }
    });

    notificationsApi.add({
      type: 'success',
      children: `Item ${viewingItem.id ? 'updated' : 'created'} successfully.`
    });

    reloadItems();
    setViewingItem();
  });
  useNotification(createOrUpdateError);

  const {
    execute: purchase,
    error: purchaseError,
    isLoading: purchaseIsLoading
  } = useAsync(async () => {
    for (const { id } of cart) {
      await pave.execute({
        query: {
          createItemPurchase: { $: { itemId: id }, ...rootContextQuery }
        }
      });
    }

    notificationsApi.add({
      type: 'success',
      children: `Item${cart.length > 1 && 's'} purchased successfully.`
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
          className='absolute leading-none top-6 right-6 text-3xl'
        >
          &times;
        </button>
        {!viewingItem && (
          <h2 className='text-xl font-semibold'>
            {viewingItem
              ? viewingItem.id
                ? `${viewingItem.update ? 'Update ' : ''}${viewingItem.name}`
                : 'Create New Item'
              : 'Store'}
          </h2>
        )}
        <div className='grow overflow-y-auto'>
          {viewingItem ? (
            <div className='space-y-2 grow'>
              <a
                onclick={() => setViewingItem()}
                className='block cursor-pointer text-orange-500 hover:text-orange-600'
              >
                <ArrowLeftIcon className='h-4 inline-block text-orange-500 align-[-0.125rem]' />{' '}
                Back to Store
              </a>
              <div className='grid gap-4 md:grid-cols-3 grow'>
                <div className='relative w-full border rounded aspect-square p-2'>
                  <ItemPreview item={viewingItem} />
                </div>
                {viewingItem.update ? (
                  <div className='space-y-2'>
                    <Input
                      placeholder='Name'
                      className='w-full'
                      value={viewingItem.name}
                      oninput={({ target: { value } }) =>
                        addChange({ name: value })
                      }
                    />
                    <Input
                      placeholder='Description'
                      className='w-full'
                      value={viewingItem.description}
                      oninput={({ target: { value } }) =>
                        addChange({ description: value })
                      }
                    />
                    <Input
                      placeholder='Price'
                      type='number'
                      className='w-full'
                      value={viewingItem.price}
                      oninput={({ target: { value } }) =>
                        addChange({ price: Math.max(Number(value), 0) })
                      }
                    />
                    <Input
                      placeholder='Discounted Price'
                      type='number'
                      className='w-full'
                      value={viewingItem.discountedPrice}
                      oninput={({ target: { value } }) =>
                        addChange({
                          discountedPrice: value
                            ? Math.max(Number(value), 0)
                            : null
                        })
                      }
                    />
                    <Input
                      placeholder='Limited To'
                      type='number'
                      className='w-full'
                      value={viewingItem.limitedTo}
                      oninput={({ target: { value } }) =>
                        addChange({
                          limitedTo: value ? Math.max(Number(value), 0) : null
                        })
                      }
                    />
                    <select
                      className='w-full border rounded p-2'
                      onchange={({ target: { value } }) =>
                        addChange({ type: value })
                      }
                    >
                      {['badge', 'avatarEffect', 'hat'].map(type => (
                        <option
                          key={type}
                          value={type}
                          selected={type === viewingItem.type}
                        >
                          {titleize(type)}
                        </option>
                      ))}
                    </select>
                    {Object.entries(viewingItem.attributes).map(
                      ([key, value], i) => (
                        <div key={i} className='flex gap-2'>
                          <Input
                            placeholder='Key'
                            className='w-full'
                            value={key}
                            oninput={({ target: { value } }) =>
                              addChange({
                                attributes: {
                                  ...omit(viewingItem.attributes, key),
                                  [value]: viewingItem.attributes[key]
                                }
                              })
                            }
                          />
                          <Input
                            placeholder='Value'
                            className='w-full'
                            value={value}
                            oninput={({ target: { value } }) =>
                              addChange({
                                attributes: {
                                  ...viewingItem.attributes,
                                  [key]: value
                                }
                              })
                            }
                          />
                          <button
                            className='border shrink-0 py-2 px-4 cursor-pointer w-36 text-center rounded hover:bg-gray-50 transition'
                            onclick={() => {
                              addChange({
                                attributes: omit(viewingItem.attributes, key)
                              });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                    {newAttribute && (
                      <div className='flex gap-2'>
                        <Input
                          placeholder='Key'
                          className='w-full'
                          value={newAttribute.key}
                          oninput={({ target: { value } }) =>
                            setNewAttribute({ ...newAttribute, key: value })
                          }
                        />
                        <Input
                          placeholder='Value'
                          className='w-full'
                          value={newAttribute.value}
                          oninput={({ target: { value } }) =>
                            setNewAttribute({ ...newAttribute, value })
                          }
                        />
                        <button
                          className='border shrink-0 py-2 px-4 cursor-pointer w-36 text-center rounded hover:bg-gray-50 transition'
                          onclick={() => {
                            addChange({
                              attributes: {
                                ...viewingItem.attributes,
                                [newAttribute.key]: newAttribute.value
                              }
                            });
                            setNewAttribute({});
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-1'>
                    <div className='flex justify-between font-bold text-2xl items-center'>
                      <div>
                        {viewingItem.name}
                        {player.isSuperAdmin && (
                          <>
                            {' '}
                            <a
                              className='cursor-pointer'
                              onclick={() => addChange({ update: true })}
                            >
                              <SquarePenIcon className='h-5 inline-block text-orange-500 align-[-0.125rem]' />
                            </a>
                          </>
                        )}
                      </div>
                      <div>
                        {viewingItem.discountedPrice ? (
                          <>
                            {viewingItem.discountedPrice}{' '}
                            <span className='font-normal line-through text-gray-500'>
                              {viewingItem.price}
                            </span>
                          </>
                        ) : (
                          viewingItem.price
                        )}
                      </div>
                    </div>
                    <div className='text-lg'>{viewingItem.description}</div>
                    <button
                      className='w-full border rounded py-2 px-4 cursor-pointer disabled:pointer-events-none disabled:opacity-50 rounded ml-auto hover:bg-gray-50 transition'
                      disabled={
                        (viewingItem.discountedPrice ?? viewingItem.price) >
                        player.credits
                      }
                      onclick={() => {
                        setCart([
                          ...cart.filter(({ id }) => id !== viewingItem.id),
                          viewingItem
                        ]);
                        setViewingItem();
                      }}
                    >
                      {(viewingItem.discountedPrice ?? viewingItem.price) >
                      player.credits
                        ? 'Not enough credits'
                        : 'Add to Cart'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='grid gap-4 grid-cols-2 md:grid-cols-8'>
              {itemsError && <Notice>{itemsError}</Notice>}
              {itemsAreLoading && <LoadingArea />}
              {itemsData && (
                <>
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className='relative aspect-square border cursor-pointer overflow-hidden rounded hover:border-orange-500 transition'
                      onclick={() => setViewingItem(item)}
                      style={
                        i === 0
                          ? { gridColumn: 'span 2', gridRow: 'span 2' }
                          : {}
                      }
                    >
                      <div className='absolute top-0 z-10 right-0 border-b border-l bg-gray-50 rounded-bl px-3 py-1 font-bold'>
                        {item.discountedPrice && (
                          <>
                            <span className='line-through font-normal'>
                              {item.price}
                            </span>{' '}
                          </>
                        )}
                        {item.discountedPrice ?? item.price}
                      </div>
                      {item.limitedTo && (
                        <div className='absolute bottom-0 z-10 left-0 border-t border-r rounded-tr bg-gray-50 px-3 py-1 font-bold'>
                          Limited
                        </div>
                      )}
                      <ItemPreview item={item} />
                    </div>
                  ))}
                  {!items.length && (
                    <div className='text-center my-auto col-span-4'>
                      There are currently no items available, please check back
                      later!
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className='flex mt-auto'>
          {player.isSuperAdmin && !viewingItem && (
            <button
              className='border py-2 px-4 cursor-pointer rounded hover:bg-gray-50 transition'
              onclick={() => {
                setViewingItem({ attributes: {}, update: true });
              }}
            >
              Create Item
            </button>
          )}
          {player.isSuperAdmin && viewingItem?.id && (
            <button
              className='py-2 px-4 border cursor-pointer rounded hover:bg-gray-50 transition'
              onclick={() => setViewingItem({ ...viewingItem, id: null })}
            >
              Clone
            </button>
          )}
          {viewingItem ? (
            viewingItem.update && (
              <button
                className='bg-green-500 text-white py-2 px-4 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded ml-auto hover:bg-green-700 transition'
                onclick={execute}
                disabled={createOrUpdateIsLoading}
              >
                {viewingItem.id ? 'Update' : 'Create'}
              </button>
            )
          ) : (
            <button
              className='bg-green-500 text-white py-2 px-4 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded ml-auto hover:bg-green-700 transition'
              disabled={
                !cart.length || cartTotal > player.credits || purchaseIsLoading
              }
              onclick={purchase}
            >
              Purchase {cart.length > 1 && `${cart.length} `}Item
              {cart.length > 1 && 's'}
              {cart.length > 0 && ` for ${cartTotal} Credits`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
