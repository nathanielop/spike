import history from '#src/constants/history.js';
import useLocation from '#src/hooks/use-location.js';

const { URLSearchParams } = globalThis;

// Reads/writes the current URL's query string, keeping the pathname intact.
// Returns [params, setParams] where `params` is a URLSearchParams for the
// current location and `setParams(patch, { replace, scrollToTop })` merges the
// patch into the query (a null/undefined/'' value removes that key) and
// navigates via history. Component re-renders whenever the location changes.
export default () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const setParams = (patch, { replace = false, scrollToTop = false } = {}) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const search = next.toString();
    const url = `${location.pathname}${search ? `?${search}` : ''}`;
    history[replace ? 'replace' : 'push'](url, scrollToTop);
  };

  return [params, setParams];
};
