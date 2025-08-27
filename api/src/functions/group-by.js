export default (arr, keyOrFn) =>
  arr.reduce((obj, val) => {
    const value = typeof keyOrFn === 'function' ? keyOrFn(val) : val[keyOrFn];
    return Object.assign(obj, {
      ...obj,
      [value]: [...(obj[value] ?? []), val]
    });
  }, {});
