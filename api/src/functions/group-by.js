export default (arr, key) =>
  arr.reduce(
    (obj, val) =>
      Object.assign(obj, {
        [val[key]]: [...(arr[val[key]] ?? []), val],
        ...obj
      }),
    {}
  );
