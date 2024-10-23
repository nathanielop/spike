import { useCallback, useEffect, useState } from 'endr';

export default initial => {
  const [val, setVal] = useState(!!initial);

  const toggle = useCallback(() => setVal(v => (v ? false : true)), [setVal]);
  const open = useCallback(() => setVal(true), [setVal]);
  const close = useCallback(() => setVal(false), [setVal]);

  useEffect(() => setVal(!!initial), [initial]);

  return [val, open, close, toggle];
};
