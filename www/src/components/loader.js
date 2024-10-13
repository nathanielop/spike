import clsx from 'clsx';

export default ({ color, size }) => (
  <div
    className={clsx(
      'relative',
      size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-10 h-10'
    )}
  >
    {['loading-part-a', 'loading-part-b', 'loading-part-c'].map(className => (
      <div
        key={className}
        className={clsx(
          'absolute box-border rounded-full loader-ring-piece border-x-transparent border-b-transparent',
          className,
          size === 'small'
            ? 'w-4 h-4 border-2'
            : size === 'medium'
              ? 'w-5 h-5 border-2'
              : 'w-8 h-8 border-4 m-1',
          color === 'white' ? 'border-t-white' : 'border-t-propelBlue'
        )}
      />
    ))}
  </div>
);
