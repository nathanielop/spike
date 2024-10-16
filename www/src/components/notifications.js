import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'endr';

import CircleAlert from '#src/components/icons/circle-alert.js';
import CircleCheck from '#src/components/icons/circle-check.js';
import CircleHelp from '#src/components/icons/circle-help.js';
import notificationsApi from '#src/constants/notifications.js';

const { setTimeout } = globalThis;

let id = 0;

const Notification = ({ notification }) => {
  const [shouldUnmount, setShouldUnmount] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const { id, message, type, duration } = notification;

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(false);
      setShouldUnmount(true);
    }, duration * 1000);
  }, [setIsVisible, duration]);

  // Trigger slide in animation
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
      setHasMounted(true);
    }, 100);
  }, []);

  const IconComponent =
    type === 'error' ? CircleAlert : type === 'info' ? CircleHelp : CircleCheck;

  return (
    <div
      className='max-w-full w-96 p-2 transition-all relative'
      style={
        isVisible ? { opacity: 1, left: '0px' } : { opacity: 0, left: '400px' }
      }
      ontransitionend={
        shouldUnmount ? () => notificationsApi.remove({ id }) : undefined
      }
    >
      <div
        className={clsx(
          'w-full shadow-lg rounded overflow-hidden text-white',
          type === 'error'
            ? 'bg-red-500'
            : type === 'success'
              ? 'bg-green-500'
              : 'bg-gray-500'
        )}
      >
        <div className='p-2 space-x-1 w-full font-bold flex items-center'>
          <IconComponent className='h-5 text-white' />{' '}
          <span className='leading-none'>
            {type.slice(0, 1).toUpperCase() + type.slice(1)}
          </span>
        </div>
        <div className='p-2 bg-black bg-opacity-10'>{message}</div>
        <div
          className='bg-black bg-opacity-50 h-1 ease-linear transition-all'
          style={{
            transitionDuration: `${duration}s`,
            width: hasMounted ? '0%' : '100%'
          }}
        />
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
