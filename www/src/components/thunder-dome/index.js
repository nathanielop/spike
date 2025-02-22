import clsx from 'clsx';
import { useState } from 'endr';

import Button from '#src/components/button.js';
import Keypad from '#src/components/thunder-dome/keypad.js';
import Warrior from '#src/components/thunder-dome/warrior.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useToggle from '#src/hooks/use-toggle.js';

export default ({ matchDetails, onComplete, onExit }) => {
  const { series } = matchDetails;
  const [teamA, teamB] = series.teams;
  const [exiting, exit] = useToggle();
  const [game, setGame] = useState(matchDetails.game);
  const [keypadState, setKeypadState] = useState();

  const { execute: completeGame, error: completeGameError } = useAsync(
    async ({ winningTeam, losingTeam }) => {
      const { completeGame } = await pave.execute({
        query: {
          completeGame: {
            $: {
              id: game.id,
              losingTeamId: losingTeam.id,
              losingTeamScore: losingTeam.score,
              winningTeamId: winningTeam.id,
              winningTeamScore: winningTeam.score
            },
            createdGame: { id: {} },
            series: { $: { id: series.id }, id: {}, completedAt: {} }
          }
        }
      });

      if (completeGame.series.completedAt) {
        onComplete();
        exit();
      } else {
        setGame(completeGame.createdGame);
      }
    }
  );
  useNotification(completeGameError);

  const {
    execute: cancelGame,
    error: cancelGameError,
    isLoading: cancelGameIsLoading
  } = useAsync(async () => {
    await pave.execute({ query: { deleteGame: { $: { id: game.id } } } });
    exit();
  });
  useNotification(cancelGameError);

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-transparent z-[100]'>
      <div
        className={clsx(
          'w-1/2 h-full flex flex-col items-center justify-center bg-blue-500 transform -translate-x-full',
          exiting ? 'animate-slideOutLeft' : 'animate-slideInLeft'
        )}
        onanimationend={() => {
          if (exiting) onExit();
        }}
      >
        <div
          className='p-4 space-y-4'
          onclick={() =>
            setKeypadState({ winningTeam: teamA, losingTeam: teamB })
          }
        >
          <h1 className='text-white text-4xl font-bold'>Team 1</h1>
          {teamA.players.map(player => (
            <Warrior key={player.id} profile={player} />
          ))}
        </div>
      </div>
      <div
        className={clsx(
          'w-1/2 h-full flex flex-col items-center justify-center bg-red-500 transform translate-x-full',
          exiting ? 'animate-slideOutRight' : 'animate-slideInRight'
        )}
      >
        <div
          className='p-4 space-y-4'
          onclick={() =>
            setKeypadState({ winningTeam: teamB, losingTeam: teamA })
          }
        >
          <h1 className='text-white text-4xl font-bold mb-4'>Team 2</h1>
          {teamB.players.map(player => (
            <Warrior key={player.id} profile={player} />
          ))}
        </div>
      </div>
      {keypadState && (
        <Keypad
          onComplete={score => {
            completeGame(score);
            setKeypadState();
          }}
          onClose={() => setKeypadState()}
          state={keypadState}
        />
      )}
      <Button
        className='absolute top-2 left-2'
        disabled={cancelGameIsLoading}
        onclick={cancelGame}
      >
        Cancel
      </Button>
    </div>
  );
};
