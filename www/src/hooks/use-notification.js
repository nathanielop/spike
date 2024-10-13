import { useEffect, useRef } from 'endr';

import notificationsApi from '#src/constants/notifications.js';

export default children => {
  const hasMountedNotificationRef = useRef(false);

  useEffect(() => {
    if (hasMountedNotificationRef.current || !children) return;

    notificationsApi.add({ children });
    hasMountedNotificationRef.current = true;
  }, [children]);

  useEffect(() => {
    if (hasMountedNotificationRef.current && !children) {
      hasMountedNotificationRef.current = false;
    }
  }, [children]);
};
