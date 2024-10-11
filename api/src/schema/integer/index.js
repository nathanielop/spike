import PublicError from '#src/constants/public-error.js';

export default {
  input: {
    object: {
      max: { nullable: 'integer' },
      min: { nullable: 'integer' }
    },
    defaultValue: {}
  },
  type: 'number',
  resolve: ({ input: { max, min }, value }) => {
    if (!Number.isInteger(value)) {
      throw new PublicError(
        `Expected a value of type Integer but was provided value ${JSON.stringify(value)}`
      );
    }

    if (min !== null && value < min) {
      throw new PublicError(
        `Expected a value of type Integer with a minimum value of ${min} but was provided a value of ${value}`
      );
    }

    if (max !== null && value > max) {
      throw new PublicError(
        `Expected a value of type Integer with a maximum value of ${max} but was provided a value of ${value}`
      );
    }

    return value;
  }
};
