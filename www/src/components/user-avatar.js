import clsx from 'clsx';

export default ({
  player,
  className,
  resetDisplay,
  resetShadow,
  resetRounding,
  showItems,
  textClassName = 'text-xs',
  ...props
}) => {
  const borderItem = player.items?.find(
    ({ item, isEquipped }) => isEquipped && item.type === 'avatarEffect'
  )?.item;
  const badgeItem = player.items?.find(
    ({ item, isEquipped }) => isEquipped && item.type === 'badge'
  )?.item;
  const hatItem = player.items?.find(
    ({ item, isEquipped }) => isEquipped && item.type === 'hat'
  )?.item;
  return (
    <div
      className={clsx(
        'aspect-square',
        !resetDisplay && 'relative',
        !resetShadow && 'shadow-md shadow-slate-600 active:shadow-sm',
        !resetRounding && 'rounded-xl',
        className
      )}
      {...props}
    >
      <div className='absolute inset-0 p-1 flex flex-col bg-white items-center text-center rounded-xl justify-center'>
        <div className={clsx('max-w-full truncate', textClassName)}>
          {player.name}
        </div>
      </div>
      <img
        className={clsx(
          'relative z-10 w-full h-full',
          !resetRounding && 'rounded-xl'
        )}
        key={player.id}
        src={player.avatarUrl}
        alt={player.name}
      />
      {showItems && borderItem && (
        <div
          className={clsx(
            'absolute z-10 inset-0',
            !resetRounding && 'rounded-xl'
          )}
          style={borderItem.attributes}
        />
      )}
      {showItems && badgeItem && (
        <div className='absolute p-1 text-xs shadow bg-white z-10 w-[min(40%,2rem)] h-[min(40%,2rem)] flex items-center justify-center -top-[min(20%,1rem)] -left-[min(20%,1rem)] rounded-full'>
          {badgeItem.attributes.children}
        </div>
      )}
      {showItems && hatItem && (
        <div
          className='absolute w-2/3 -top-1/3 -right-1/3 z-10 rotate-45 aspect-square bg-center bg-no-repeat bg-contain'
          style={{ backgroundImage: `url("store/${hatItem.attributes.src}")` }}
        />
      )}
    </div>
  );
};
