import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';

const { size } = config.ids;

export default {
  resolve: ({ path, value }) => {
    if (value.length === size && value.match(/^[A-Za-z0-9]+$/)) return value;

    throw new PublicError(
      `Expected a value of type id at ${path.join('.')} but got ${JSON.stringify(value)}`
    );
  }
};
