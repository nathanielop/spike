export default (arr, key) =>
  arr.reduce((obj, val) => Object.assign(obj, { [val[key]]: val, ...obj }), {});
