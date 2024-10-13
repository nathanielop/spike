import clsx from 'clsx';

import Loader from '#src/components/loader.js';

export default ({ className }) => (
  <div
    className={clsx(
      'p-4 flex flex-col justify-center items-center grow',
      className
    )}
  >
    <Loader />
  </div>
);
