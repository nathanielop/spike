const units = ['k', 'm', 'b'];

/**
 * @param {string} n
 * @param {number} places
 */
export default (n, places = 1) => {
  const spots = n.split(',');
  const unit = units[spots.length - 2];
  if (!unit) return n;
  const precision = spots[1].slice(0, places);
  const isValidRemainder = isFinite(Number(precision)) && Number(precision) > 0;
  return places && isValidRemainder
    ? `${spots[0]}.${precision}${unit}`
    : `${spots[0]}${unit}`;
};
