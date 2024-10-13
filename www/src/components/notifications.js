import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'endr';

import Icon from '#src/components/icon.js';
import notificationsApi from '#src/constants/notifications.js';

const { setTimeout } = globalThis;

let id = 0;

const Notification = ({ notification }) => {
  const { id, message, type, duration } = notification;

  useEffect(
    () =>
      void setTimeout(() => notificationsApi.remove({ id }), duration * 1000),
    [duration, id]
  );

  return (
    <div className='max-w-full w-96 p-2'>
      <div
        className={clsx(
          'w-full shadow-lg rounded text-white',
          type === 'error'
            ? 'bg-red-500'
            : type === 'success'
              ? 'bg-green-500'
              : 'bg-gray-500'
        )}
      >
        <div className='p-2 space-x-1 w-full font-bold flex items-center'>
          <Icon
            name={
              type === 'error'
                ? 'circle-alert'
                : type === 'info'
                  ? 'circle-help'
                  : 'circle-check'
            }
            className='h-5 text-white'
          />{' '}
          <span className='leading-none'>
            {type.slice(0, 1).toUpperCase() + type.slice(1)}
          </span>
        </div>
        <div className='p-2 bg-black bg-opacity-10'>{message}</div>
      </div>
    </div>
  );
};

export default () => {
  const [notifications, setNotifications] = useState([]);

  notificationsApi.add = useCallback(
    ({ children, duration = 5, type = 'info' }) => {
      if (children instanceof Error) type = 'error';
      const message = children?.message ?? children;
      setNotifications(arr => [...arr, { id: ++id, type, message, duration }]);
    },
    [setNotifications]
  );

  notificationsApi.remove = useCallback(
    ({ id }) => {
      const ind = notifications.findIndex(not => not.id === id);
      if (ind === -1) return;
      setNotifications(notifications => [
        ...notifications.slice(0, ind),
        ...notifications.slice(ind + 1)
      ]);
    },
    [setNotifications, notifications]
  );

  return (
    <div className='fixed right-0 bottom-0 z-[9999] p-4'>
      {notifications.map(notification => (
        <Notification key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
