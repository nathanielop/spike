import clsx from 'clsx';
import { useState } from 'endr';

export default ({ onComplete, onClose, state }) => {
  const [score, setScore] = useState(state);
  const [input, setInput] = useState('');
  const mode = score.winningTeam.score ? 'loser' : 'winner';
  const players = (mode === 'loser' ? score.losingTeam : score.winningTeam)
    .players;
  return (
    <div
      className={clsx(
        'absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 bg-opacity-50 z-50',
        mode === 'winner' ? 'animate-slideInLeft' : 'animate-slideInUp'
      )}
    >
      <div className='relative bg-white p-8 rounded-lg shadow-lg'>
        <button onclick={onClose} className='absolute top-2 right-2 text-3xl'>
          &times;
        </button>
        <h2 className='text-xl font-semibold mb-4'>
          {players.map(({ name }) => name).join(' & ')}&apos;s score
        </h2>
        <div className='text-center text-3xl p-4 bg-gray-100 mb-4'>{input}</div>
        <div className='grid grid-cols-3 gap-2'>
          {Array.from({ length: 9 }, (_, i) => i).map(num => (
            <button
              key={num + 1}
              className='bg-blue-500 text-white text-2xl p-3 rounded hover:bg-blue-700 transition'
              onclick={() => setInput(input + (num + 1))}
            >
              {num + 1}
            </button>
          ))}
        </div>
        <div className='w-full flex justify-center py-2 space-x-2'>
          <button
            key={0}
            className='w-full bg-blue-500 text-white text-2xl p-3 rounded hover:bg-blue-700 transition'
            onclick={() => setInput(input + 0)}
          >
            0
          </button>
          <button
            className='bg-yellow-300 text-white text-2xl p-3 rounded hover:bg-gray-700 transition'
            onclick={() => setInput(input.slice(0, -1))}
          >
            ←
          </button>
        </div>
        <button
          className='bg-green-500 text-white p-2 rounded w-full hover:bg-green-700 transition'
          onclick={() => {
            if (mode === 'loser') {
              onComplete({
                ...score,
                losingTeam: { ...score.losingTeam, score: parseInt(input) }
              });
            } else {
              setScore({
                ...score,
                winningTeam: { ...score.winningTeam, score: parseInt(input) }
              });
              setInput('');
            }
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
