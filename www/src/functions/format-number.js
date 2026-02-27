const { Intl } = globalThis;

export default (value, options) =>
  Intl.NumberFormat('en-US', options).format(value);
