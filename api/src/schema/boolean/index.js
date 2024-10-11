import PublicError from '#src/constants/public-error.js';

const TRUE_VALUES = ['true', 'yes', '1', 'y', 't'];
const FALSE_VALUES = ['false', 'no', '0', 'n', 'f'];

export default {
  resolve: ({ value }) => {
    if (typeof value === 'boolean') return value;

    if (typeof value === 'string') {
      value = value.trim().toLowerCase();

      if (TRUE_VALUES.indexOf(value) !== -1) return true;
      if (FALSE_VALUES.indexOf(value) !== -1) return false;
    }

    if (typeof value === 'number' && (value === 1 || value === 0)) {
      return value === 1;
    }

    throw new PublicError(
      `Expected a value of type Boolean but was provided value ${JSON.stringify(value)}`
    );
  }
};
