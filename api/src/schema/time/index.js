import PublicError from '#src/constants/public-error.js';

export default {
  resolve: ({ value }) => {
    if (typeof value === 'string' && !value.trim()) return null;

    const strDate = (
      value instanceof Date ? value : new Date(`0000-01-01T${value}`)
    ).toJSON();
    if (strDate) return strDate.slice(11, -1);

    throw new PublicError(
      `Expected a value of type Time but was provided value ${JSON.stringify(value)}`
    );
  }
};
