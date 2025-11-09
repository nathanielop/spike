const { Intl } = globalThis;

const formatter = Intl.NumberFormat('en-US');

export default formatter.format;
