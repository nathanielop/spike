import { useState } from 'endr';

import Home from '#src/components/home.js';
import LoadingArea from '#src/components/loading-area.js';
import Notice from '#src/components/notice.js';
import ThunderDome from '#src/components/thunder-dome.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import usePave from '#src/hooks/use-pave.js';

export default () => {
  const [loadThunderdome, setLoadThunderdome] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [randomize, setRandomize] = useState(true);

  const { execute: onComplete, error: completeError } = useAsync(async () => {
    await pave.execute({
      query: {
        updateGame: {} // TODO
      }
    });
  });
  useNotification(completeError);

  const { data, error, isLoading } = usePave({
    query: { players: { id: {}, name: {}, nickname: {}, avatarUrl: {} } }
  });

  const shuffleProfiles = profiles => {
    for (let i = profiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [profiles[i], profiles[j]] = [profiles[j], profiles[i]]; // ES6 destructuring swap
    }
    return profiles;
  };

  return (
    <>
      {isLoading && <LoadingArea />}
      {error && <Notice>{error}</Notice>}
      {data && (
        <>
          <Home
            profiles={data?.players ?? []}
            selectedProfiles={selectedProfiles}
            setSelectedProfiles={setSelectedProfiles}
            setLoadThunderdome={setLoadThunderdome}
            randomize={randomize}
            setRandomize={setRandomize}
          />
          {loadThunderdome && (
            <ThunderDome
              selectedProfiles={
                randomize
                  ? shuffleProfiles([...selectedProfiles])
                  : selectedProfiles
              }
              setLoadThunderdome={setLoadThunderdome}
              setSelectedProfiles={setSelectedProfiles}
              onCompleteGame={onComplete}
            />
          )}
        </>
      )}
    </>
  );
};
