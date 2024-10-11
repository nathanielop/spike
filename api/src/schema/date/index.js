import PublicError from '#src/constants/public-error.js';

export default {
  resolve: ({ value }) => {
    if (typeof value === 'string' && !value.trim()) return null;

    const strDate = (
      value instanceof Date ? value : new Date(`${value}T00:00:00.000Z`)
    ).toJSON();
    if (strDate) return strDate.slice(0, 10);

    throw new PublicError(
      `Expected a value of type Date but was provided value ${JSON.stringify(value)}`
    );
  }
};
