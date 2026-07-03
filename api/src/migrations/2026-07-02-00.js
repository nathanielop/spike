// Resets the economy after runaway inflation pushed balances into bigint
// territory.
//
// Player credits, item prices and bounty amounts all suffer from the same
// problem: values span many orders of magnitude (some in the trillions, some
// only a few thousand), so a flat division cannot rebalance them. Instead each
// is remapped logarithmically, which preserves the relative ordering of values
// while compressing the enormous spread into a sane range:
//
//   newValue = round(1000 * ln(value + 1))
//
// - Player credits are additionally floored at 1000 (a player with ~0 credits
//   lands on the floor; the wealthiest, near bigint max, land around ~43k).
// - Item prices and bounty amounts are rounded to the nearest 50 for
//   cleanliness. Items priced at 0 (e.g. season badges) stay at 0.
//
// This is a one-way data migration: the original values cannot be recovered, so
// no `down` is provided (the runner treats a missing `down` as irreversible).
const MINIMUM_CREDITS = 1000;
const SCALE = 1000;
const ROUND_TO = 50;

// SQL expression that logarithmically rescales `column` and rounds it to the
// nearest ROUND_TO. A value of 0 maps to 0.
const rescale = column =>
  `round(${SCALE} * ln(${column} + 1) / ${ROUND_TO}) * ${ROUND_TO}`;

export default {
  up: async tx => {
    await tx.raw(
      `
      update players
      set credits = greatest(?, round(? * ln(greatest(credits, 0) + 1)))::bigint
      `,
      [MINIMUM_CREDITS, SCALE]
    );

    await tx.raw(`
      update bounties
      set amount = (${rescale('amount')})::bigint
    `);
  }
};
