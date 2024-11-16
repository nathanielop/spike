import { useEffect, useRef } from 'endr';

import config from '#src/config.js';

const { WebSocket } = globalThis;

const { apiUrl } = config.jtspike;

export default ({ query: _query, skip, onData, onError }) => {
  const socketRef = useRef();

  useEffect(() => {
    if (skip) return;

    const socket = new WebSocket(apiUrl.replace('https', 'ws'));

    socket.addEventListener('message', event =>
      event.error ? onError(event.error) : onData(event)
    );

    socketRef.current = socket;

    return () => socket.close();
  }, [onData, onError, skip]);

  return { data, isLoading, execute, error };
};
