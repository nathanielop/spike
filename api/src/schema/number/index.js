import PublicError from '#src/constants/public-error.js';

export default {
  input: {
    object: {
      max: { nullable: 'number' },
      min: { nullable: 'number' }
    },
    defaultValue: {}
  },
  resolve: ({ input: { max, min }, value }) => {
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      if (!isNaN(Number(value))) value = Number(value);
      else {
        throw new PublicError(
          `Expected a value of type Number but was provided value ${JSON.stringify(value)}`
        );
      }
    }

    if (max !== null && value > max) {
      throw new PublicError(
        `Expected a value of type Number with a maximum value of ${max} but was provided a value of ${value}`
      );
    }

    if (min !== null && value < min) {
      throw new PublicError(
        `Expected a value of type Number with a minimum value of ${min} but was provided a value of ${value}`
      );
    }

    return value;
  }
};
