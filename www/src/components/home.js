import clsx from 'clsx';
import { useEffect, useState } from 'endr';

import Button from '#src/components/button.js';
import ChevronRightIcon from '#src/components/icons/chevron-right.js';
import CircleCheckIcon from '#src/components/icons/circle-check.js';
import ThunderDome from '#src/components/thunder-dome/index.js';
import UserAvatar from '#src/components/user-avatar.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useRootContext from '#src/hooks/use-root-context.js';
import useToggle from '#src/hooks/use-toggle.js';

const slots = [0, 1, 2, 3];

export default ({ players, reload }) => {
  const { player } = useRootContext();
  const [matchDetails, setMatchDetails] = useState();
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [randomize, , , toggleRandomize] = useToggle(true);
  const [bestOf, setBestOf] = useState(3);

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
              players: {
                id: {},
                name: {},
                avatarUrl: { $: { size: 200 } },
                activeBounties: { id: {} },
                items: {
                  item: { id: {}, type: {}, attributes: {} },
                  isEquipped: {}
                }
              }
            }
          }
        }
      }
    });

    setMatchDetails({ series: createdSeries, game: createdGame });
  });
  useNotification(createGameError);

  useEffect(() => {
    if (selectedPlayers.length === 4) createGame();
  }, [selectedPlayers.length, createGame]);

  const togglePlayer = p => {
    if (selectedPlayers.find(sp => sp.id === p.id)) {
      setSelectedPlayers(selectedPlayers.filter(sp => sp.id !== p.id));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, p]);
    }
  };

  const isSelected = p => selectedPlayers.some(sp => sp.id === p.id);

  return (
    <div className='relative flex h-screen w-screen bg-gray-50'>
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
      <div className='flex flex-col h-full shrink-0 border-r border-gray-200 bg-white w-64'>
        <div className='p-4 border-b border-gray-100'>
          <img
            src='/spike.svg'
            alt='JTSpike'
            className='w-full h-8 object-left object-contain'
          />
        </div>
        <div className='flex-1 overflow-y-auto min-h-0'>
          {[...players]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(p => {
              const selected = isSelected(p);
              return (
                <div
                  key={p.id}
                  className={clsx(
                    'flex border-l-4 items-center gap-1 px-3 py-1.5 cursor-pointer transition-colors',
                    selected
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent hover:bg-gray-50'
                  )}
                  onclick={() => togglePlayer(p)}
                >
                  <UserAvatar
                    player={p}
                    resetShadow
                    resetRounding
                    className='w-6 h-6 shrink-0 border rounded overflow-hidden'
                  />
                  <span
                    className={clsx(
                      'truncate flex-1 text-sm',
                      selected ? 'text-blue-700 font-semibold' : 'text-gray-700'
                    )}
                  >
                    {p.name}
                  </span>
                  {selected && (
                    <CircleCheckIcon className='w-4 h-4 text-blue-500 shrink-0' />
                  )}
                </div>
              );
            })}
        </div>
        <div className='p-4 border-gray-100 space-y-2 shrink-0 border-t'>
          <Button
            onclick={toggleRandomize}
            resetColor={randomize}
            className={clsx('w-full !py-2 text-sm', randomize && 'bg-blue-500')}
          >
            Random
          </Button>
          <div className='flex w-full gap-1'>
            {[1, 3, 5].map(format => (
              <Button
                key={format}
                onclick={() => setBestOf(format)}
                resetColor={bestOf === format}
                className={clsx(
                  'flex-1 !py-2 text-sm',
                  format === bestOf && 'bg-blue-500'
                )}
              >
                BO{format}
              </Button>
            ))}
          </div>
        </div>
        <a
          href='/profile'
          className='flex items-center border-t gap-2 px-4 py-2 rounded hover:bg-gray-50 transition-colors'
        >
          <UserAvatar
            player={player}
            resetRounding
            resetShadow
            className='w-7 h-7 shrink-0'
          />
          <span className='text-sm text-gray-600 flex-1'>Go to Profile</span>
          <ChevronRightIcon className='w-4 h-4 text-gray-400' />
        </a>
      </div>
      <div className='flex-1 flex flex-col overflow-y-auto'>
        <div className='p-4 space-y-4'>
          <div className='space-y-0.5'>
            <div className='text-xl font-bold text-gray-800'>Match Room</div>
            <div className='text-gray-500 font-light text-sm leading-none'>
              {randomize ? 'Random' : 'Manual'} &middot; Best of {bestOf}
            </div>
          </div>
          <div
            className='flex flex-col gap-2 max-w-prose'
            style={{ maxWidth: 380 }}
          >
            {slots.map(i => {
              const p = selectedPlayers[i];
              const teamLabel = !randomize
                ? i < 2
                  ? 'Team 1'
                  : 'Team 2'
                : null;

              return (
                <div key={i} className='flex flex-col'>
                  {teamLabel && (i === 0 || i === 2) && (
                    <span className='text-xs text-gray-400 uppercase tracking-wide mb-1 mt-2'>
                      {teamLabel}
                    </span>
                  )}
                  <div
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
                      p
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-dashed border-gray-300 bg-white'
                    )}
                  >
                    {p ? (
                      <>
                        <UserAvatar
                          player={p}
                          resetRounding
                          resetShadow
                          className='w-10 h-10 shrink-0 rounded overflow-hidden border'
                        />
                        <span className='font-semibold text-gray-800'>
                          {p.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className='w-10 h-10 rounded bg-gray-100 shrink-0' />
                        <span className='text-gray-400 text-sm'>
                          Select a player
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedPlayers.length > 0 && selectedPlayers.length < 4 && (
            <Button className='text-sm' onclick={() => setSelectedPlayers([])}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
