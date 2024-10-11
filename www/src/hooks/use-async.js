import { useCallback, useState } from 'endr';

export default callback => {
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async args => {
      try {
        setIsLoading(true);
        setError();
        const data = await callback(args);
        setData(data);
        setIsLoading(false);
      } catch (er) {
        setIsLoading(false);
        setError(er);
      }
    },
    [callback]
  );

  return { execute, data, error, isLoading };
};
