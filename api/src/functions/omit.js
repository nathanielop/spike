export default (obj, keyOrKeys) => {
  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
  return Object.fromEntries(
    Object.entries(obj).flatMap(([k, v]) => (keys.includes(k) ? [] : [[k, v]]))
  );
};
