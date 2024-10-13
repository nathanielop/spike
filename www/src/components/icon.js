import clsx from 'clsx';

export default ({ name, className }) => (
  <img
    src={`/icons/${name}.svg`}
    className={clsx('stroke-currentColor', className)}
  />
);
