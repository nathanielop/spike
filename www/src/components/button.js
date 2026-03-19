import clsx from 'clsx';

export default ({
  onclick,
  children,
  className,
  resetRounding,
  resetColor
}) => (
  <button
    onclick={onclick}
    className={clsx(
      'px-4 py-2 text-white text-center align-middle transition-[all]',
      !resetColor && 'active:bg-gray-600 bg-gray-500',
      !resetRounding && 'rounded-md',
      className
    )}
  >
    {children}
  </button>
);
