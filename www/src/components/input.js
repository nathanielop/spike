import clsx from 'clsx';

export default ({ className, elRef, ...props }) => (
  <input
    ref={elRef}
    className={clsx(
      'transition-[all] placeholder:text-gray-500 placeholder:text-gray-400 p-2 block border rounded focus:outline-orange-500 active:border-orange-500 focus:border-orange-500 hover:border-orange-500',
      className
    )}
    {...props}
  />
);
