import { Fragment, useState } from 'endr';

import Home from '#src/components/home.js';
import ThunderDome from '#src/components/thunder-dome.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
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

  const { data, error, isLoading } = usePave({
    query: {
      players: {
        id: {},
        name: {}
      }
    }
  });

  const shuffleProfiles = profiles => {
    for (let i = profiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [profiles[i], profiles[j]] = [profiles[j], profiles[i]]; // ES6 destructuring swap
    }
    return profiles;
  };

  if (isLoading) return <h1>...Loading</h1>;

  return (
    <Fragment>
      <Home
        profiles={data?.profiles ?? []}
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
    </Fragment>
  );
};
