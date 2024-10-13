import clsx from 'clsx';

export default ({ player, className, ...props }) => (
  <div className={clsx('relative', className)}>
    <div className='absolute inset-0 p-2 flex flex-col items-center text-center justify-center'>
      <div className='text-xs'>{player.name}</div>
    </div>
    <img
      className='relative rounded-xl shadow-md shadow-slate-600 active:shadow-sm z-10'
      key={player.id}
      src={player.avatarUrl}
      alt={player.name}
      {...props}
    />
  </div>
);
