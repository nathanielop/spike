import { useEffect } from 'endr';

import App from '#src/components/app.js';
import LoadingArea from '#src/components/loading-area.js';
import LoginOrSignup from '#src/components/login.js';
import Notice from '#src/components/notice.js';
import Notifications from '#src/components/notifications.js';
import Profile from '#src/components/profile.js';
import disk from '#src/constants/disk.js';
import history from '#src/constants/history.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import RootContext from '#src/constants/root-context.js';
import useLocation from '#src/hooks/use-location.js';
import usePave from '#src/hooks/use-pave.js';

const { Set } = globalThis;

const unauthenticatedPaths = new Set(['/login', '/register']);

export default () => {
  const urlLocation = useLocation();
  const grantKey = disk.get('grantKey');

  const { data, error, isLoading, execute } = usePave({
    query: rootContextQuery,
    skip: !grantKey
  });

  const unauthenticated = !grantKey || !data?.currentGrant;

  useEffect(() => {
    if (unauthenticatedPaths.has(urlLocation.pathname)) {
      if (data?.currentGrant) history.replace('/');
      else return;
    } else if (!grantKey && !unauthenticatedPaths.has(urlLocation.pathname)) {
      history.replace('/login');
    }
  }, [urlLocation.pathname, data, grantKey]);

  if (error) return <Notice>{error}</Notice>;

  if (grantKey && !data && isLoading) {
    return <LoadingArea className='w-full h-full' />;
  }

  return (
    <RootContext
      value={{
        location: urlLocation,
        season: data?.currentSeason,
        player: data?.currentGrant?.player,
        grant: data?.currentGrant
      }}
    >
      <div className='flex w-full h-full grow flex-col'>
        <Notifications />
        {unauthenticated ? (
          <LoginOrSignup onLogin={execute} />
        ) : !data.currentGrant.player.isAdmin ||
          urlLocation.pathname === '/profile' ? (
          <Profile reload={execute} />
        ) : (
          <App />
        )}
      </div>
    </RootContext>
  );
};
