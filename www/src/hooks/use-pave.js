import { useCallback, useLayoutEffect, useRef, useState } from 'endr';
import mergeRefs from 'pave/src/merge-refs.js';

import pave from '#src/constants/pave.js';

export default ({ query: _query, skip }) => {
  const query = useRef(_query);
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError();
    try {
      setData(await pave.execute({ query: query.current }));
    } catch (er) {
      setError(er);
    }
    setIsLoading(false);
  }, []);

  useLayoutEffect(
    () => (query.current = mergeRefs(_query, query.current)),
    [_query]
  );

  useLayoutEffect(() => !skip && execute(), [execute, skip]);

  return { data, isLoading, execute, error };
};
