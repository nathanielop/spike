export default (a, b) => {
  const aAvgElo = a.reduce((acc, { elo }) => acc + elo, 0) / a.length;
  const bAvgElo = b.reduce((acc, { elo }) => acc + elo, 0) / b.length;
  return [
    1 / (1 + 10 ** ((bAvgElo - aAvgElo) / 1000)),
    1 / (1 + 10 ** ((aAvgElo - bAvgElo) / 1000))
  ];
};
