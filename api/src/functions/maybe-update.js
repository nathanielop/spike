// Dumb function for shallowly checking if values have changed
// from original (a) to new (b) and updating obj with the new values.
// We'll have to come back and expand on this if we need to do deep equality checks.
export default (obj, a, b) => {
  for (const key in a) {
    if (!(key in b)) continue;
    if (a[key] !== b[key]) obj[key] = b[key];
  }
};
