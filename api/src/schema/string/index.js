import PublicError from '#src/constants/public-error.js';

export default {
  input: {
    object: {
      trim: { type: 'boolean', defaultValue: true },
      maxLength: { type: 'integer', defaultValue: 1000 },
      minLength: { nullable: 'integer' }
    },
    defaultValue: {}
  },
  resolve: ({ input: { trim, maxLength, minLength }, value }) => {
    if (value == null) return null;

    if (typeof value !== 'string') {
      if (typeof value.toString === 'function') {
        value = value.toString();
      } else {
        throw new PublicError(
          `Expected a value of type String but was provided value ${JSON.stringify(value)}`
        );
      }
    }

    if (trim) value = value.trim();

    if (minLength !== null && value.length < minLength) {
      throw new PublicError(
        `Expected a value of type String with a minimum length of ${minLength} but was provided a value with length ${value.length}`
      );
    }

    if (value.length > maxLength) {
      throw new PublicError(
        `Expected a value of type String with a maximum length of ${maxLength} but was provided a value with length ${value.length}`
      );
    }

    return value;
  }
};
