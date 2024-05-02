import Home from "./Home";
import { Fragment, useEffect, useState } from "endr";
import ThunderDome from "./ThunderDome";

// tablet size 262 x 159 x 7.7 mm
// Screen Resolution	800 x 1280 pixels

export type Profile = {
  id: string;
  name: string;
};

export type Scores = {
  winner: { team: string[]; score?: number };
  loser: { team: string[]; score?: number };
} | null;

const apiUrl = import.meta.env.VITE_API_URL;

const createGame = async ({ query }) => {
  const response = await fetch(`${apiUrl}/pave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ data: query }),
  });

  return response.json();
};

export default () => {
  const [loadThunderdome, setLoadThunderdome] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);

  const onCompleteGame = async (scores: Scores) => {
    if (scores) {
      await createGame({
        query: {
          createGame: {
            $: { scores },
            games: { id: {}, winner: {}, loser: {} },
          },
        },
      });
      return true;
    } else {
      alert("Sumting wong");
    }
  };

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [randomize, setRandomize] = useState(false);

  const fetchData = async () => {
    const res = await fetch(`${apiUrl}/pave/profiles`, {
      method: "GET",
    });
    const data = await res.json();
    setProfiles(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const shuffleProfiles = (profiles) => {
    for (let i = profiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [profiles[i], profiles[j]] = [profiles[j], profiles[i]]; // ES6 destructuring swap
    }
    return profiles;
  };

  if (profiles.length === 0) return <h1>...Loading</h1>;

  return (
    <Fragment>
      <Home
        profiles={profiles}
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
          onCompleteGame={onCompleteGame}
        />
      )}
    </Fragment>
  );
};
