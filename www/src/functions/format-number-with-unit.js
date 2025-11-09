import formatUnit from '#src/functions/format-unit.js';

const { Intl } = globalThis;

const formatter = Intl.NumberFormat('en-US');

/**
 * @param {number} number
 * @param {Parameters<typeof formatUnit>[1] | never} props
 */
export default (number, props = undefined) =>
  formatUnit(formatter.format(number), props);
