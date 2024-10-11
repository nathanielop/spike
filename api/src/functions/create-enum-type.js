export default values => ({
  oneOf: Object.fromEntries(values.map(value => [value, {}])),
  resolveType: value => value
});
