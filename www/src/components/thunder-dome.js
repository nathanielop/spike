import clsx from 'clsx';
import { useState } from 'endr';

import Button from '#src/components/button.js';

const Keypad = ({ type, onComplete, onClose, slideDirection = 'up' }) => {
  const [input, setInput] = useState('');
  return (
    <div
      className={clsx(
        'absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50',
        slideDirection === 'left' ? 'animate-slideInLeft' : 'animate-slideInUp'
      )}
    >
      <div className='relative bg-white p-8 rounded-lg shadow-lg'>
        <button onClick={onClose} className='absolute top-2 right-2 text-3xl'>
          &times;
        </button>
        <h2 className='text-xl font-semibold mb-4'>
          {type === 'winner' ? 'Winner' : 'Loser'}&apos;s score
        </h2>
        <input
          type='text'
          value={input}
          onChange={e => setInput(e.target.value)}
          className='text-center text-3xl p-4 bg-gray-100 w-full mb-4'
        />
        <div className='grid grid-cols-3 gap-2'>
          {Array.from({ length: 9 }, (_, i) => i).map(num => (
            <button
              key={num + 1}
              className='bg-blue-500 text-white text-2xl p-3 rounded hover:bg-blue-700 transition'
              onClick={() => setInput(input + (num + 1))}
            >
              {num + 1}
            </button>
          ))}
        </div>
        <div className='w-full flex justify-center py-2 space-x-2'>
          <button
            key={0}
            className='w-full bg-blue-500 text-white text-2xl p-3 rounded hover:bg-blue-700 transition'
            onClick={() => setInput(input + 0)}
          >
            0
          </button>
          <button
            className='bg-yellow-300 text-white text-2xl p-3 rounded hover:bg-gray-700 transition'
            onClick={() => setInput(input.slice(0, -1))}
          >
            ←
          </button>
        </div>
        <button
          className='ml-2 bg-green-500 text-white p-2 rounded-full w-full hover:bg-green-700 transition'
          onClick={() => onComplete({ score: input })}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const Warrior = ({ profile }) => (
  <div className='p-4'>
    <img
      className='h-[16rem] rounded-xl shadow-md shadow-slate-600'
      key={profile.id}
      src={profile.avatarUrl}
      alt={profile.name}
    />
  </div>
);

export default ({
  selectedProfiles,
  setSelectedProfiles,
  setLoadThunderdome,
  onCompleteGame
}) => {
  const [isReversing, setIsReversing] = useState(false);

  const handleClose = () => {
    setIsReversing(true);
  };

  const handleAnimationEnd = () => {
    if (isReversing) {
      setLoadThunderdome(false);
      setSelectedProfiles([]);
      setIsReversing(false);
    }
  };

  const [scoreState, setScoreState] = useState(null);

  const handleScoreEntry = ({ winnerTeam, loserTeam, score }) => {
    setScoreState(prev => {
      if (!prev) {
        return {
          winner: { team: winnerTeam },
          loser: { team: loserTeam }
        };
      } else if (prev.winner && !prev.winner.score) {
        return {
          ...prev,
          winner: { team: prev.winner.team, score }
        };
      } else {
        onCompleteGame({ ...prev, loser: { team: prev.loser.team, score } });
        setIsReversing(true);
        handleAnimationEnd();
      }
    });
  };

  return (
    <div className='absolute top-0 w-screen h-screen flex items-center justify-center bg-transparent z-100'>
      <div
        className={clsx(
          'w-1/2 h-full flex flex-col items-center justify-center bg-blue-500 transform -translate-x-full',
          isReversing ? 'animate-slideOutLeft' : 'animate-slideInLeft'
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          className='p-4'
          onClick={() =>
            handleScoreEntry({
              winnerTeam: [selectedProfiles[0].id, selectedProfiles[1].id],
              loserTeam: [selectedProfiles[2].id, selectedProfiles[3].id]
            })
          }
        >
          <h1 className='text-white text-4xl font-bold mb-4'>Team 1</h1>
          <Warrior profile={selectedProfiles[0]} />
          <Warrior profile={selectedProfiles[1]} />
        </div>
      </div>
      <div
        className={clsx(
          'w-1/2 h-full flex flex-col items-center justify-center bg-red-500 transform translate-x-full',
          isReversing ? 'animate-slideOutRight' : 'animate-slideInRight'
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <div
          className='p-4'
          onClick={() =>
            handleScoreEntry({
              winnerTeam: [selectedProfiles[2].id, selectedProfiles[3].id],
              loserTeam: [selectedProfiles[0].id, selectedProfiles[1].id]
            })
          }
        >
          <h1 className='text-white text-4xl font-bold mb-4'>Team 2</h1>
          <Warrior profile={selectedProfiles[2]} />
          <Warrior profile={selectedProfiles[3]} />
        </div>
      </div>
      {scoreState?.winner && !scoreState?.winner.score && (
        <Keypad
          type='winner'
          onComplete={handleScoreEntry}
          onClose={() => setScoreState(null)}
        />
      )}
      {scoreState?.winner?.score && (
        <Keypad
          onComplete={handleScoreEntry}
          onClose={() => setScoreState(null)}
          slideDirection='left'
        />
      )}
      <Button className='absolute top-2 left-2' onClick={handleClose}>
        Back
      </Button>
    </div>
  );
};
