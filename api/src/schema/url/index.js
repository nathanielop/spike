import PublicError from '#src/constants/public-error.js';

const { URL } = globalThis;

export default {
  type: 'string',
  resolve: ({ value }) => {
    if (value == null) return null;

    if (typeof value === 'string' && !value.trim()) return null;

    try {
      return new URL(value).toString();
    } catch {
      throw new PublicError(
        `Expected a value of type URL but was provided value ${JSON.stringify(value)}`
      );
    }
  }
};
