export default (arr, key) =>
  arr.reduce((obj, val) => {
    const value = val[typeof key === 'function' ? key(val) : key];
    return Object.assign(obj, {
      ...obj,
      [value]: [...(obj[value] ?? []), val]
    });
  }, {});
