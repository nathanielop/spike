// Magnitude specifies at which elo difference the odds would be 90/10,
// so a 1000 point collective elo difference would be a 90/10 game
const magnitude = 1000;

export default (a, b) => {
  const aAvgElo = a.reduce((acc, { elo }) => acc + elo, 0) / a.length;
  const bAvgElo = b.reduce((acc, { elo }) => acc + elo, 0) / b.length;
  return [
    1 / (1 + 10 ** ((bAvgElo - aAvgElo) / magnitude)),
    1 / (1 + 10 ** ((aAvgElo - bAvgElo) / magnitude))
  ];
};
