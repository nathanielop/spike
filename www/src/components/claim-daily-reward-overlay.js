import clsx from 'clsx';
import { useEffect, useRef, useState } from 'endr';

import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';

const { setTimeout } = globalThis;

const duration = 10 * 1000;

const slices = [20, 20, 50, 20, 20, 100, 20, 20, 250, 500];

const shuffle = arr => {
  const array = arr.slice();
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default ({ onClose, onClaimed }) => {
  const wheelRef = useRef();
  const [result, setResult] = useState();

  const {
    execute: claim,
    error: claimError,
    isLoading: claimIsLoading
  } = useAsync(async () => {
    const { claimDailyReward: reward } = await pave.execute({
      query: { claimDailyReward: {} }
    });
    setResult(reward);
  });
  useNotification(claimError);

  useEffect(() => {
    if (!result) return;

    const [index] = shuffle(Object.entries(slices)).find(
      ([, credits]) => credits === result
    );

    const degrees =
      90 - // Offset
      index * (360 / slices.length) + /// Result
      360 * 10 + // Additional rotations
      0.9 * (-1 + Math.random() * 2) * (360 / slices.length / 2); // Random offset

    wheelRef.current.animate([{ transform: `rotate(${degrees}deg)` }], {
      duration,
      direction: 'normal',
      easing: 'cubic-bezier(.41,.88,.49,1.03)',
      fill: 'forwards',
      iterations: 1
    });

    setTimeout(() => {
      onClaimed();
      onClose();
      notificationsApi.add({
        type: 'success',
        children: `You have won ${result} credits from your daily reward.`
      });
    }, duration + 1000);
  }, [result, onClose, onClaimed]);

  return (
    <div className='fixed inset-0 p-8 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 animate-slideInUp'>
      <div className='relative bg-white p-8 max-w-full flex flex-col gap-4 rounded-lg shadow-lg'>
        <button
          onclick={onClose}
          className='absolute leading-none top-2 right-2 text-3xl'
        >
          &times;
        </button>
        <h2 className='text-xl font-semibold'>Claim Daily Reward</h2>
        <div className='relative'>
          <div
            ref={wheelRef}
            className={clsx(
              'h-72 w-72 grid rounded-full overflow-hidden bg-gray-50',
              claimIsLoading && 'pointer-events-none'
            )}
            style={{
              placeContent: 'center start',
              containerType: 'inline-size'
            }}
            ontransitionend={() =>
              result &&
              setTimeout(() => {
                onClaimed();
                onClose();
              }, 1000)
            }
          >
            {slices.map((reward, i) => (
              <div
                key={i}
                className='p-2 font-semibold'
                style={{
                  gridArea: '1 / -1',
                  alignContent: 'center',
                  fontSize: '5cqi',
                  width: '50cqi',
                  transformOrigin: 'right',
                  rotate: `calc(360deg / ${slices.length} * ${i})`,
                  background: `hsl(calc(360deg / ${slices.length} * ${i}), 100%, 75%)`,
                  height: `calc((2 * pi * 50cqi) / ${slices.length})`,
                  clipPath: 'polygon(0% -2%, 100% 50%, 0% 102%)'
                }}
              >
                {reward}
              </div>
            ))}
          </div>
          <div
            className='absolute w-16 cursor-pointer flex items-center justify-center font-bold h-16 rounded-full bg-white border-4 border-gray-50'
            onclick={claim}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            Spin
          </div>
          <div
            className='w-4 h-4 absolute -top-1 bg-red-500'
            style={{
              left: '50%',
              transform: 'translate(-50%)',
              clipPath: 'polygon(50% 100%, 100% 0, 0 0)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
