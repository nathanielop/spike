import clsx from 'clsx';
import { useEffect, useState } from 'endr';

import Button from '#src/components/button.js';
import ThunderDome from '#src/components/thunder-dome/index.js';
import UserAvatar from '#src/components/user-avatar.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useRootContext from '#src/hooks/use-root-context.js';
import useToggle from '#src/hooks/use-toggle.js';

const {
  clearInterval,
  window,
  setInterval,
  setTimeout,
  SpeechSynthesisUtterance,
  speechSynthesis
} = globalThis;

const initialRadius = 120;

export default ({ players, reload }) => {
  const { player } = useRootContext();
  const [size, setSize] = useState({
    width: window.innerWidth / 2,
    height: window.innerHeight / 2
  });
  const [radius, setRadius] = useState(initialRadius); // Initial radius
  const [expanding, setExpanding] = useState(false);
  const [matchDetails, setMatchDetails] = useState();
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [randomize, , , toggleRandomize] = useToggle(true);
  const [bestOf, setBestOf] = useState(3);

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerHeight / 2.5,
        height: window.innerHeight / 2.5
      });
    };
    window.addEventListener('resize', updateSize);
    updateSize();
  }, []);

  useEffect(() => {
    let interval;
    const duration = 4500; // 4.5 seconds total duration
    const steps = 1000;
    const stepDuration = duration / steps;
    const maxRadius = 800;
    const growthFactor = Math.pow(maxRadius / radius / 2, 1.5 / steps);

    if (expanding) {
      interval = setInterval(() => {
        setRadius(currentRadius => {
          const newRadius = currentRadius * growthFactor;
          if (newRadius >= maxRadius) {
            clearInterval(interval);
            setExpanding(false);
            return initialRadius;
          }
          return newRadius;
        });
      }, stepDuration);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [expanding]);

  const { execute: createGame, error: createGameError } = useAsync(async () => {
    const {
      createSeriesAndGame: { createdGame, createdSeries }
    } = await pave.execute({
      query: {
        createSeriesAndGame: {
          $: {
            bestOf,
            players: selectedPlayers.map(({ id }, i) => ({
              id,
              team: randomize ? null : Math.floor(i / 2)
            }))
          },
          createdGame: { id: {} },
          createdSeries: {
            id: {},
            bestOf: {},
            teams: {
              id: {},
              players: { id: {}, name: {}, avatarUrl: { $: { size: 200 } } }
            }
          }
        }
      }
    });

    setTimeout(() => setExpanding(true), 500);
    setTimeout(
      () => setMatchDetails({ series: createdSeries, game: createdGame }),
      4000
    );
  });
  useNotification(createGameError);

  useEffect(() => {
    if (selectedPlayers.length === 4) createGame();
  }, [selectedPlayers.length, createGame]);

  return (
    <div className='flex overflow-hidden'>
      {matchDetails && (
        <ThunderDome
          matchDetails={matchDetails}
          onComplete={reload}
          onExit={() => {
            setMatchDetails();
            setSelectedPlayers([]);
          }}
          setMatchDetails={setMatchDetails}
        />
      )}
      <div className='w-1/6 min-w-0 p-4 bg-purple-700'>
        <img src='/spikelogo.png' className='w-full' />
      </div>
      <div className='relative h-screen w-3/4 items-center justify-center'>
        <div className='flex h-screen self-center animate-cw-spin'>
          {players.map((player, index) => (
            <div
              key={player.id}
              className='absolute w-[5rem] p-1 items-center justify-center active:w-[4.8rem]'
              style={{
                left: `calc(50% + ${
                  Math.cos((2 * Math.PI * index) / players.length) * size.width
                }px)`,
                top: `calc(50% + ${
                  Math.sin((2 * Math.PI * index) / players.length) * size.height
                }px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <UserAvatar
                player={player}
                className='animate-ccw-spin'
                onclick={() => {
                  const utterance = new SpeechSynthesisUtterance(
                    `${player.name}${player.nickname ? ` the ${player.nickname}` : ''}`
                  );
                  utterance.voice = speechSynthesis.getVoices()[201];
                  speechSynthesis.speak(utterance);

                  if (
                    selectedPlayers.length < 4 &&
                    !selectedPlayers.includes(player)
                  ) {
                    setSelectedPlayers([...selectedPlayers, player]);
                  }
                }}
              />
            </div>
          ))}
        </div>
        <div className='absolute flex w-full h-full top-0 right-0 items-center justify-center pointer-events-none'>
          <div
            className={clsx(
              'relative flex h-24 w-24 rounded-full',
              selectedPlayers.length === 4 && 'animate-exp-spin'
            )}
            style={{
              backgroundImage: `url("/jtlogo.png")`,
              backgroundSize: 'cover'
            }}
          >
            {selectedPlayers.length > 0 && selectedPlayers.length !== 4 && (
              <Button
                className='absolute px-[0.7rem] py-[0.3rem] -bottom-1 -right-1 text-xl z-10 pointer-events-auto opacity-80'
                onclick={() => setSelectedPlayers([])}
              >
                &times;
              </Button>
            )}
            {selectedPlayers.map((player, index) => (
              <UserAvatar
                key={player.id}
                player={player}
                resetDisplay
                className='absolute w-20 h-20'
                style={{
                  left: `calc(50% + ${
                    radius * Math.cos((2 * Math.PI * index) / 4)
                  }px)`,
                  top: `calc(50% + ${
                    radius * Math.sin((2 * Math.PI * index) / 4)
                  }px)`,
                  transform: 'translate(-50%, -50%)',
                  ...(!randomize && {
                    boxShadow: `${
                      index < 2 ? '0px 0px 30px blue' : '0px 0px 30px red'
                    }`
                  })
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className='w-1/6 bg-purple-700 flex flex-col p-4'>
        <a href='/profile' className='block ml-auto'>
          <UserAvatar player={player} className='h-10 w-10' />
        </a>
        <div className='mt-auto space-y-2'>
          <Button
            onclick={toggleRandomize}
            className={clsx('w-full', randomize && 'bg-green-500')}
          >
            Random
          </Button>
          <div className='flex'>
            {[1, 3, 5].map(format => (
              <Button
                key={format}
                onclick={() => setBestOf(format)}
                resetRounding
                className={clsx(
                  'w-full first:rounded-l-md last:rounded-r-md',
                  format === bestOf && 'bg-green-500'
                )}
              >
                BO{format}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
