import clsx from 'clsx';

export default ({ onClick, children, className }) => (
  <button
    onClick={onClick}
    className={clsx(
      'px-4 py-2 rounded-md text-white text-center align-middle transition-[all] active:bg-gray-600 active:scale-[0.98] bg-gray-500',
      className
    )}
  >
    {children}
  </button>
);
