import clsx from 'clsx';

export default ({
  player,
  className,
  resetDisplay,
  textClassName = 'text-xs',
  ...props
}) => (
  <div
    className={clsx(
      'rounded-xl shadow-md shadow-slate-600 active:shadow-sm overflow-hidden',
      !resetDisplay && 'relative',
      className
    )}
    {...props}
  >
    <div className='absolute inset-0 p-2 flex flex-col bg-white items-center text-center justify-center'>
      <div className={clsx('max-w-full truncate', textClassName)}>
        {player.name}
      </div>
    </div>
    <img
      className='relative z-10 w-full h-full'
      key={player.id}
      src={player.avatarUrl}
      alt={player.name}
    />
  </div>
);
