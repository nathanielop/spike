import { useCallback, useEffect, useState } from 'endr';

export default initial => {
  const [val, setVal] = useState(!!initial);
  const toggle = useCallback(() => setVal(value => !value));
  const open = useCallback(() => setVal(true));
  const close = useCallback(() => setVal(false));

  useEffect(() => {
    setVal(!!initial)
  }, [initial]);

  return [val, open, close, toggle];
};
