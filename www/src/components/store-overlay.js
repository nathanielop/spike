import clsx from 'clsx';
import { useState } from 'endr';

import ArrowLeftIcon from '#src/components/icons/arrow-left.js';
import SquareCheckIcon from '#src/components/icons/square-check.js';
import SquarePenIcon from '#src/components/icons/square-pen.js';
import SquareIcon from '#src/components/icons/square.js';
import StoreIcon from '#src/components/icons/store.js';
import Input from '#src/components/input.js';
import ItemPreview from '#src/components/item-preview.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import formatNumberWithUnit from '#src/functions/format-number-with-unit.js';
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

const itemTypes = ['badge', 'avatarEffect', 'hat', 'theme'];

const formatPrice = price => (price ? formatNumberWithUnit(price) : 'Free');

export default ({ onClose, onPurchase }) => {
  const { player } = useRootContext();
  const [cart, setCart] = useState([]);
  const [viewingItem, setViewingItem] = useState();
  const [newAttribute, setNewAttribute] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

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
        isForSale: {},
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
    <div className='fixed inset-0 z-50 flex items-center justify-center animate-slideInUp'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black bg-opacity-50'
        onclick={onClose}
      />

      {/* Modal */}
      <div className='relative flex flex-col w-full h-full max-w-6xl max-h-[90vh] mx-4 rounded-xl overflow-hidden shadow-2xl bg-white'>
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <StoreIcon className='w-6 h-6 text-orange-500' />
            <h2 className='text-xl font-bold text-gray-800'>
              {viewingItem
                ? viewingItem.id
                  ? viewingItem.update
                    ? `Editing: ${viewingItem.name}`
                    : viewingItem.name
                  : 'Create New Item'
                : 'Item Shop'}
            </h2>
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5'>
              <span className='text-orange-500 text-sm font-bold'>
                {formatNumberWithUnit(player.credits)}
              </span>
              <span className='text-gray-500 text-xs'>credits</span>
            </div>
            <button
              onclick={onClose}
              className='text-gray-400 hover:text-gray-700 transition text-2xl leading-none cursor-pointer'
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className={clsx(
            'flex-1 p-6',
            viewingItem ? 'overflow-y-auto' : 'overflow-hidden'
          )}
        >
          {viewingItem ? (
            <div className='space-y-4'>
              <a
                onclick={() => setViewingItem()}
                className='inline-flex items-center gap-1 cursor-pointer text-orange-500 hover:text-orange-600 text-sm transition'
              >
                <ArrowLeftIcon className='h-4' />
                Back to Shop
              </a>

              <div className='grid gap-6 md:grid-cols-[240px_1fr]'>
                {/* Item Preview Card */}
                <div className='relative aspect-square rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-center'>
                  {viewingItem.discountedPrice && (
                    <div className='absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded'>
                      SALE
                    </div>
                  )}
                  {viewingItem.limitedTo && (
                    <div className='absolute bottom-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded'>
                      LIMITED
                    </div>
                  )}
                  <ItemPreview item={viewingItem} />
                </div>

                {/* Details / Edit */}
                {viewingItem.update ? (
                  <div className='space-y-3'>
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
                    <div className='grid grid-cols-2 gap-3'>
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
                        placeholder='Sale Price'
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
                    </div>
                    <Input
                      placeholder='Limited To (quantity)'
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

                    {/* Attributes */}
                    <div className='border-t border-gray-200 pt-3'>
                      <span className='text-gray-500 text-xs uppercase tracking-wide'>
                        Attributes
                      </span>
                      <div className='space-y-2 mt-2'>
                        {Object.entries(viewingItem.attributes).map(
                          ([key, value], i) => (
                            <div key={i} className='flex gap-2'>
                              <Input
                                placeholder='Key'
                                className='flex-1'
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
                                className='flex-1'
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
                                className='shrink-0 px-3 py-1.5 text-sm rounded border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer transition'
                                onclick={() =>
                                  addChange({
                                    attributes: omit(
                                      viewingItem.attributes,
                                      key
                                    )
                                  })
                                }
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
                              className='flex-1'
                              value={newAttribute.key}
                              oninput={({ target: { value } }) =>
                                setNewAttribute({ ...newAttribute, key: value })
                              }
                            />
                            <Input
                              placeholder='Value'
                              className='flex-1'
                              value={newAttribute.value}
                              oninput={({ target: { value } }) =>
                                setNewAttribute({ ...newAttribute, value })
                              }
                            />
                            <button
                              className='shrink-0 px-3 py-1.5 text-sm rounded border border-green-200 text-green-600 hover:bg-green-50 cursor-pointer transition'
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
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col gap-4'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='text-2xl font-bold text-gray-800'>
                            {viewingItem.name}
                          </h3>
                          {player.isSuperAdmin && (
                            <a
                              className='cursor-pointer'
                              onclick={() => addChange({ update: true })}
                            >
                              <SquarePenIcon className='h-4 text-orange-500' />
                            </a>
                          )}
                        </div>
                        <span className='text-gray-400 text-sm'>
                          {titleize(viewingItem.type)}
                        </span>
                      </div>
                      <div className='text-right'>
                        {viewingItem.discountedPrice ? (
                          <div className='flex items-center gap-2'>
                            <span className='text-gray-400 line-through text-sm'>
                              {formatPrice(viewingItem.price)}
                            </span>
                            <span className='text-orange-500 font-bold text-xl'>
                              {formatPrice(viewingItem.discountedPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className='text-orange-500 font-bold text-xl'>
                            {formatPrice(viewingItem.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    {viewingItem.description && (
                      <p className='text-gray-600'>{viewingItem.description}</p>
                    )}

                    {/* Item details */}
                    <div className='grid grid-cols-2 gap-3 py-3 border-t border-b border-gray-100'>
                      <div>
                        <span className='text-xs text-gray-400 uppercase tracking-wide'>
                          Type
                        </span>
                        <p className='text-sm font-medium text-gray-700'>
                          {titleize(viewingItem.type)}
                        </p>
                      </div>
                      <div>
                        <span className='text-xs text-gray-400 uppercase tracking-wide'>
                          Availability
                        </span>
                        <p className='text-sm font-medium text-gray-700'>
                          {viewingItem.limitedTo
                            ? `Limited (${viewingItem.limitedTo} remaining)`
                            : 'Unlimited'}
                        </p>
                      </div>
                      {viewingItem.discountedPrice && (
                        <div>
                          <span className='text-xs text-gray-400 uppercase tracking-wide'>
                            You Save
                          </span>
                          <p className='text-sm font-medium text-green-600'>
                            {formatNumberWithUnit(
                              viewingItem.price - viewingItem.discountedPrice
                            )}{' '}
                            credits
                          </p>
                        </div>
                      )}
                      <div>
                        <span className='text-xs text-gray-400 uppercase tracking-wide'>
                          Your Balance
                        </span>
                        <p
                          className={clsx(
                            'text-sm font-medium',
                            (viewingItem.discountedPrice ?? viewingItem.price) >
                              player.credits
                              ? 'text-red-500'
                              : 'text-gray-700'
                          )}
                        >
                          {formatNumberWithUnit(player.credits)} credits
                        </p>
                      </div>
                    </div>

                    <button
                      className={clsx(
                        'w-full py-3 px-4 rounded-lg font-semibold text-sm cursor-pointer transition',
                        (viewingItem.discountedPrice ?? viewingItem.price) >
                          player.credits
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                      )}
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
                        ? 'Not Enough Credits'
                        : 'Add to Cart'}
                    </button>
                  </div>
                )}
              </div>

              {/* Similar Items */}
              {!viewingItem.update &&
                (() => {
                  const similar = items.filter(
                    i =>
                      i.id !== viewingItem.id &&
                      i.type === viewingItem.type &&
                      i.isForSale
                  );
                  if (!similar.length) return null;
                  return (
                    <div className='mt-6 border-t border-gray-200 pt-4'>
                      <h4 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
                        Similar Items
                      </h4>
                      <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                        {similar.slice(0, 5).map(item => (
                          <div
                            key={item.id}
                            className='group relative aspect-square rounded-lg border border-gray-200 cursor-pointer overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all'
                            onclick={() => setViewingItem(item)}
                          >
                            <div className='absolute top-0 right-0 z-10 bg-white/90 rounded-bl px-1.5 py-0.5 border-b border-l border-gray-100'>
                              <span className='text-orange-500 font-bold text-xs'>
                                {formatPrice(
                                  item.discountedPrice ?? item.price
                                )}
                              </span>
                            </div>
                            <ItemPreview item={item} />
                            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-800/70 to-transparent p-1.5 pt-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <span className='text-white text-xs truncate block'>
                                {item.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>
          ) : (
            <div className='flex flex-col lg:flex-row gap-6 h-full'>
              {/* Filters sidebar - fixed, non-scrolling */}
              <div className='shrink-0 lg:w-52 flex flex-col gap-4 lg:overflow-visible'>
                <Input
                  placeholder='Search items...'
                  className='w-full'
                  value={search}
                  oninput={({ target: { value } }) => setSearch(value)}
                />

                {/* Type filter */}
                <div>
                  <span className='text-xs text-gray-400 uppercase tracking-wide mb-1 block'>
                    Type
                  </span>
                  <div className='flex lg:flex-col gap-1.5 flex-wrap'>
                    <button
                      className={clsx(
                        'px-3 py-1.5 text-sm rounded-full cursor-pointer transition text-left',
                        !typeFilter
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                      onclick={() => setTypeFilter(null)}
                    >
                      All
                    </button>
                    {itemTypes.map(type => (
                      <button
                        key={type}
                        className={clsx(
                          'px-3 py-1.5 text-sm rounded-full cursor-pointer transition text-left',
                          typeFilter === type
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                        onclick={() => setTypeFilter(type)}
                      >
                        {titleize(type)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <span className='text-xs text-gray-400 uppercase tracking-wide mb-1 block'>
                    Price Range
                  </span>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Min'
                      type='number'
                      className='w-full'
                      value={priceMin}
                      oninput={({ target: { value } }) => setPriceMin(value)}
                    />
                    <Input
                      placeholder='Max'
                      type='number'
                      className='w-full'
                      value={priceMax}
                      oninput={({ target: { value } }) => setPriceMax(value)}
                    />
                  </div>
                </div>

                {/* Affordable filter */}
                <div
                  className='flex items-center gap-2 cursor-pointer'
                  onclick={() => setAffordableOnly(!affordableOnly)}
                >
                  {affordableOnly ? (
                    <SquareCheckIcon className='w-5 h-5 text-orange-500 shrink-0' />
                  ) : (
                    <SquareIcon className='w-5 h-5 text-gray-400 shrink-0' />
                  )}
                  <span className='text-sm text-gray-600'>Can afford only</span>
                </div>
              </div>

              {/* Item grid - scrollable */}
              <div className='flex-1 min-w-0 overflow-y-auto'>
                {itemsError && <Notice>{itemsError}</Notice>}
                {itemsAreLoading && <LoadingArea />}
                {itemsData && (
                  <>
                    <div className='grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4'>
                      {(() => {
                        const filtered = items
                          .slice()
                          .filter(item => {
                            if (typeFilter && item.type !== typeFilter) {
                              return false;
                            }
                            if (
                              search &&
                              !item.name
                                .toLowerCase()
                                .includes(search.toLowerCase())
                            ) {
                              return false;
                            }
                            if (affordableOnly) {
                              const cost = item.discountedPrice ?? item.price;
                              if (cost > player.credits) return false;
                            }
                            if (priceMin) {
                              const cost = item.discountedPrice ?? item.price;
                              if (cost < Number(priceMin)) return false;
                            }
                            if (priceMax) {
                              const cost = item.discountedPrice ?? item.price;
                              if (cost > Number(priceMax)) return false;
                            }
                            return true;
                          })
                          .sort((a, b) =>
                            a.isForSale === b.isForSale
                              ? 0
                              : a.isForSale
                                ? -1
                                : 1
                          );

                        if (!filtered.length) {
                          return (
                            <div className='col-span-full text-center text-gray-400 py-16'>
                              <div className='text-4xl mb-3'>🔍</div>
                              <p className='font-medium'>No items found</p>
                              <p className='text-sm mt-1'>
                                Try adjusting your filters or search term.
                              </p>
                            </div>
                          );
                        }

                        return filtered.map(item => (
                          <div
                            key={item.id}
                            className={clsx(
                              'group relative aspect-square rounded-xl border cursor-pointer overflow-hidden transition-all',
                              cart.some(c => c.id === item.id)
                                ? 'border-orange-400 shadow-md shadow-orange-100'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
                              !item.isForSale && 'opacity-40'
                            )}
                            onclick={() => setViewingItem(item)}
                          >
                            {/* Price tag */}
                            <div className='absolute top-0 right-0 z-10 rounded-tr-xl bg-white/90 backdrop-blur-sm rounded-bl-lg px-2.5 py-1 flex items-center gap-1 border-b border-l border-gray-100'>
                              {item.discountedPrice && (
                                <span className='text-gray-400 line-through text-xs'>
                                  {formatPrice(item.price)}
                                </span>
                              )}
                              <span className='text-orange-500 font-bold text-sm'>
                                {formatPrice(
                                  item.discountedPrice ?? item.price
                                )}
                              </span>
                            </div>

                            {/* Badges */}
                            {item.limitedTo && (
                              <div className='absolute top-0 left-0 z-10 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg'>
                                LIMITED
                              </div>
                            )}
                            {/* Cart indicator */}
                            {cart.some(c => c.id === item.id) && (
                              <div className='absolute top-0 left-0 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg'>
                                IN CART
                              </div>
                            )}

                            <ItemPreview item={item} />

                            {/* Sale tag - below hover overlay */}
                            {item.discountedPrice && (
                              <div className='absolute bottom-0 right-0 z-[5] bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-tl-lg'>
                                SALE
                              </div>
                            )}

                            {/* Item name on hover */}
                            <div className='absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-gray-800/70 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <span className='text-white text-xs font-medium truncate block'>
                                {item.name}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    {!items.length && (
                      <div className='text-center text-gray-400 py-16'>
                        No items available right now. Check back later!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50'>
          <div className='flex gap-2'>
            {player.isSuperAdmin && !viewingItem && (
              <button
                className='px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer transition'
                onclick={() => setViewingItem({ attributes: {}, update: true })}
              >
                + Create Item
              </button>
            )}
            {player.isSuperAdmin && viewingItem?.id && (
              <button
                className='px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer transition'
                onclick={() => setViewingItem({ ...viewingItem, id: null })}
              >
                Clone
              </button>
            )}
          </div>
          <div className='flex items-center gap-3'>
            {viewingItem ? (
              viewingItem.update && (
                <button
                  className='px-6 py-2.5 text-sm font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition'
                  onclick={execute}
                  disabled={createOrUpdateIsLoading}
                >
                  {viewingItem.id ? 'Save Changes' : 'Create Item'}
                </button>
              )
            ) : (
              <>
                {cart.length > 0 && (
                  <span className='text-gray-500 text-sm'>
                    {cart.length} item{cart.length > 1 && 's'} &middot;{' '}
                    <span className='text-orange-500 font-semibold'>
                      {formatNumberWithUnit(cartTotal)}
                    </span>
                  </span>
                )}
                <button
                  className={clsx(
                    'px-6 py-2.5 text-sm font-semibold rounded-lg cursor-pointer transition',
                    !cart.length || cartTotal > player.credits
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                  )}
                  disabled={
                    !cart.length ||
                    cartTotal > player.credits ||
                    purchaseIsLoading
                  }
                  onclick={purchase}
                >
                  Purchase
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
