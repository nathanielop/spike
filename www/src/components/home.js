import clsx from 'clsx';
import { useEffect, useState } from 'endr';

import Button from '#src/components/button.js';
import useRootContext from '#src/hooks/use-root-context.js';

const {
  clearInterval,
  window,
  setInterval,
  setTimeout,
  SpeechSynthesisUtterance,
  speechSynthesis
} = globalThis;

const initialRadius = 120;

export default ({
  profiles,
  selectedProfiles,
  setSelectedProfiles,
  setLoadThunderdome,
  randomize,
  setRandomize
}) => {
  const { player } = useRootContext();
  const [size, setSize] = useState({
    width: window.innerWidth / 2,
    height: window.innerHeight / 2
  });
  const [radius, setRadius] = useState(initialRadius); // Initial radius
  const [expanding, setExpanding] = useState(false);

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

  const handleProfileClick = profile => {
    const utterance = new SpeechSynthesisUtterance(
      `${profile.name}${profile.nickname ? `the ${profile.nickname}` : ''}`
    );
    utterance.voice = speechSynthesis.getVoices()[201];
    speechSynthesis.speak(utterance);

    if (selectedProfiles.length < 4 && !selectedProfiles.includes(profile)) {
      setSelectedProfiles([...selectedProfiles, profile]);
    }

    if (selectedProfiles.length === 3) {
      setTimeout(() => setExpanding(true), 500);
      setTimeout(() => setLoadThunderdome(true), 4000);
    }
  };

  return (
    <div className='flex overflow-hidden'>
      <div className='w-1/6 min-w-0 p-4 bg-purple-700'>
        <img
          onclick={() => window.location.reload()}
          src='/spikelogo.png'
          className='w-full'
        />
      </div>
      <div className='relative h-screen w-3/4 items-center justify-center'>
        <div className='flex h-screen self-center animate-cw-spin'>
          {profiles.map((profile, index) => (
            <div
              key={profile.id}
              className='absolute w-[5rem] p-1 items-center justify-center active:w-[4.8rem]'
              style={{
                left: `calc(50% + ${
                  Math.cos((2 * Math.PI * index) / profiles.length) * size.width
                }px)`,
                top: `calc(50% + ${
                  Math.sin((2 * Math.PI * index) / profiles.length) *
                  size.height
                }px)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <img
                className='animate-ccw-spin rounded-xl shadow-md shadow-slate-600 active:shadow-sm'
                key={profile.id}
                src={profile.avatarUrl}
                alt={profile.name}
                onclick={() => handleProfileClick(profile)}
              />
            </div>
          ))}
        </div>
        <div className='absolute flex w-full h-full top-0 right-0 items-center justify-center pointer-events-none'>
          <div
            className={clsx(
              'relative flex h-24 w-24 rounded-full',
              selectedProfiles.length === 4 && 'animate-exp-spin'
            )}
            style={{
              backgroundImage: `url("/jtlogo.png")`,
              backgroundSize: 'cover'
            }}
          >
            {selectedProfiles.length > 0 && selectedProfiles.length !== 4 && (
              <Button
                className='absolute px-[0.7rem] py-[0.3rem] -bottom-1 -right-1 text-xl z-10 pointer-events-auto opacity-80'
                onclick={() => setSelectedProfiles([])}
              >
                &times;
              </Button>
            )}
            {selectedProfiles.map((profile, index) => (
              <img
                key={profile.id}
                src={profile.avatarUrl}
                alt={profile.name}
                className='absolute w-18 h-18 rounded-3xl shadow-lg shadow-slate-600'
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
      <div className='w-1/6 bg-purple-700 p-4'>
        <div className='flex grow justify-between'>
          <Button
            onclick={() => setRandomize(!randomize)}
            className={clsx(randomize && 'bg-green-500')}
          >
            Random
          </Button>
          <a href='/profile' className='block'>
            <img
              className='h-10 w-10 rounded-xl shadow-md shadow-slate-600 active:shadow-sm'
              src={player.avatarUrl}
              alt={player.name}
            />
          </a>
        </div>
      </div>
    </div>
  );
};
