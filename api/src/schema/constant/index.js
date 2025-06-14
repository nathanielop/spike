import PublicError from '#src/constants/public-error.js';

export default {
  input: { defaultValue: {} },
  resolve: ({ input, value }) => {
    if (value !== input) {
      throw new PublicError(
        `Expected a value of ${JSON.stringify(input)} but was provided value ${JSON.stringify(value)}`
      );
    }

    return value;
  }
};
