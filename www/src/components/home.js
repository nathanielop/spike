import clsx from 'clsx';
import { useEffect, useState } from 'endr';

import Button from '#src/components/button.js';
import ChevronRightIcon from '#src/components/icons/chevron-right.js';
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

  const selectedIndex = p => selectedPlayers.findIndex(sp => sp.id === p.id);

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
      <div className='flex flex-col h-full shrink-0 border-r border-gray-200 bg-white w-72'>
        <div className='px-4 py-2 border-b border-gray-100'>
          <img
            src='/spike.svg'
            alt='JTSpike'
            className='w-full h-8 object-left object-contain'
          />
        </div>
        <div className='px-4 pt-3 pb-2 shrink-0'>
          <div className='text-xl font-bold text-gray-800'>Match Room</div>
          <div className='text-gray-500 font-light text-sm leading-none'>
            {randomize ? 'Random' : 'Manual'} &middot; Best of {bestOf}
          </div>
        </div>
        <div className='flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1'>
          {slots.map(i => {
            const p = selectedPlayers[i];
            const teamLabel = !randomize ? (i < 2 ? 'Team 1' : 'Team 2') : null;
            const isTeam2 = !randomize && i >= 2;

            return (
              <div key={i} className='flex flex-col'>
                {teamLabel && (i === 0 || i === 2) && (
                  <span className='text-xs text-gray-400 uppercase tracking-wide mb-1 mt-2 pl-1'>
                    {teamLabel}
                  </span>
                )}
                <div
                  className={clsx(
                    'flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg border transition-colors',
                    p
                      ? isTeam2
                        ? 'border-red-200 bg-red-50'
                        : 'border-blue-200 bg-blue-50'
                      : 'border-dashed border-gray-300 bg-white'
                  )}
                >
                  {p ? (
                    <>
                      <UserAvatar
                        player={p}
                        showItems
                        resetShadow
                        className='w-11 h-11 shrink-0'
                      />
                      <span className='font-semibold text-gray-800 truncate'>
                        {p.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className='w-11 h-11 rounded-xl bg-gray-100 shrink-0' />
                      <span className='text-gray-400 text-sm'>
                        Select a player
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {selectedPlayers.length > 0 && selectedPlayers.length < 4 && (
            <Button
              className='mt-2 w-full text-sm'
              onclick={() => setSelectedPlayers([])}
            >
              Clear
            </Button>
          )}
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
            className='w-7 h-7 shrink-0 rounded overflow-hidden'
          />
          <span className='text-sm text-gray-600 flex-1'>Go to Profile</span>
          <ChevronRightIcon className='w-4 h-4 text-gray-400' />
        </a>
      </div>
      <div className='flex-1 flex flex-col min-h-0'>
        <div className='shrink-0 px-6 pt-5 pb-2 flex items-end justify-between'>
          <div>
            <div className='text-2xl font-bold text-gray-800'>Players</div>
            <div className='text-gray-500 font-light text-sm'>
              Tap to build your match
            </div>
          </div>
          <div className='text-sm font-medium text-gray-500'>
            {selectedPlayers.length}/4 selected
          </div>
        </div>
        <div className='flex-1 overflow-y-auto px-6 pt-4 pb-8'>
          <div className='grid gap-x-4 gap-y-9 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]'>
            {[...players]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => {
                const index = selectedIndex(p);
                const selected = index !== -1;
                const isTeam2 = selected && !randomize && index >= 2;
                return (
                  <div
                    key={p.id}
                    onclick={() => togglePlayer(p)}
                    className={clsx(
                      'relative flex flex-col items-center gap-2 rounded-xl p-2 cursor-pointer transition-colors',
                      selected
                        ? isTeam2
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <div className='relative w-full'>
                      <UserAvatar
                        player={p}
                        showItems
                        className={clsx(
                          'w-full',
                          selected &&
                            (isTeam2
                              ? 'ring-2 ring-red-500 rounded-xl'
                              : 'ring-2 ring-blue-500 rounded-xl')
                        )}
                      />
                    </div>
                    <span
                      className={clsx(
                        'w-full truncate text-center text-sm',
                        selected
                          ? isTeam2
                            ? 'font-semibold text-red-700'
                            : 'font-semibold text-blue-700'
                          : 'text-gray-700'
                      )}
                    >
                      {p.name}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
