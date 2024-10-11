const { localStorage, sessionStorage } = globalThis;

const targets = [localStorage, sessionStorage];

export default {
  set: (key, value) => {
    if (typeof value === 'object') value = JSON.stringify(value);
    targets.forEach(target =>
      value == null ? target.removeItem(key) : target.setItem(key, value)
    );
  },
  flush: () => {
    localStorage.clear();
    sessionStorage.clear();
  },
  getAll: () => {
    const all = {};
    for (let n = 0; n < localStorage.length; n++) {
      const key = localStorage.key(n);
      const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);
      all[key] = value;
    }
    return all;
  },
  get: key => {
    const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!value) return;

    try {
      return JSON.parse(value);
    } catch (er) {
      return value;
    }
  }
};
