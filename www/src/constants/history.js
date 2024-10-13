const { window, document, history, location, URL, Set } = globalThis;

const listeners = new Set();

const historyObj =
  /**
   * @type {{
   *   push: (url: string, scrollToTop?: boolean) => void;
   *   replace: (url: string, scrollToTop?: boolean) => void;
   *   listen: function;
   *   current: typeof location;
   * }}
   */
  ({ current: location });

/** @param {string} url */
const getUrl = url => {
  const anchor = document.createElement('a');
  anchor.href = url;
  return new URL(anchor.href);
};

/** @param {function} callback */
historyObj.listen = callback => {
  const listener = { callback };
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * @param {string} url
 * @param {boolean} scrollToTop
 */
historyObj.push = (url, scrollToTop = true) => {
  const { pathname, hash, search } = location;
  history.pushState(`${pathname}${search}${hash}`, '', url);
  if (scrollToTop) document.documentElement.scrollTo(0, 0);
  listeners.forEach(({ callback }) => callback(getUrl(url)));
};

/**
 * @param {string} url
 * @param {boolean} scrollToTop
 */
historyObj.replace = (url, scrollToTop = true) => {
  const { pathname, hash, search } = location;
  history.replaceState(`${pathname}${search}${hash}`, '', url);
  if (scrollToTop) document.documentElement.scrollTo(0, 0);
  listeners.forEach(({ callback }) => callback(getUrl(url)));
};

window.addEventListener('popstate', () =>
  listeners.forEach(({ callback }) => callback(location))
);

export default historyObj;
