import { useEffect, useState } from "endr";
import "./App.css";
import JTLogo from "./assets/jtlogo.png";
import SpikeLogo from "./assets/spikelogo.png";
import Button from "./Button";
import { Profile } from "./App";

const apiUrl = import.meta.env.VITE_API_URL;

const ProfileTile = ({
  profile,
  itemCount,
  index,
  onClick,
  size,
}: {
  profile: Profile;
  index: number;
  onClick: () => void;
  itemCount: number;
  size: { width: number; height: number };
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const handlePointerDown = () => setIsPressed(true);
  const handlePointerUp = () => setIsPressed(false);

  return (
    <div
      className={`absolute w-[5rem] p-1 items-center justify-center ${
        isPressed && "w-[4.8rem]"
      }`}
      style={{
        left: `calc(50% + ${
          Math.cos((2 * Math.PI * index) / itemCount) * size.width
        }px)`,
        top: `calc(50% + ${
          Math.sin((2 * Math.PI * index) / itemCount) * size.height
        }px)`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <img
        className={`animate-ccw-spin rounded-xl shadow-md shadow-slate-600 ${
          isPressed && "shadow-sm"
        }`}
        key={profile.id}
        src={`${apiUrl}/pave/profilepics/${profile.name.toLowerCase()}.jpeg`}
        alt={profile.name}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
};

const initialRadius = 120;

export default ({
  profiles,
  selectedProfiles,
  setSelectedProfiles,
  setLoadThunderdome,
  randomize,
  setRandomize,
}: {
  profiles: Profile[];
  selectedProfiles: Profile[];
  setSelectedProfiles: (profiles: Profile[]) => void;
  setLoadThunderdome: (set: boolean) => void;
  randomize: boolean;
  setRandomize: (set: boolean) => void;
}) => {
  const [size, setSize] = useState({
    width: window.innerWidth / 2,
    height: window.innerHeight / 2,
  });
  const [radius, setRadius] = useState(initialRadius); // Initial radius
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerHeight / 2.5,
        height: window.innerHeight / 2.5,
      });
    };
    window.addEventListener("resize", updateSize);
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
        setRadius((currentRadius) => {
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

  const handleProfileClick = (profile: Profile) => {
    if (selectedProfiles.length < 4 && !selectedProfiles.includes(profile)) {
      setSelectedProfiles([...selectedProfiles, profile]);
    }

    if (selectedProfiles.length === 3) {
      setTimeout(() => setExpanding(true), 500);
      setTimeout(() => setLoadThunderdome(true), 4000);
    }
  };

  console.log(randomize);

  return (
    <div className="flex overflow-hidden ">
      <div className="w-1/6 min-w-0 p-4 bg-purple-700">
        <img
          onClick={() => window.location.reload()}
          src={SpikeLogo}
          className="w-full"
        />
      </div>

      <div className="relative h-screen w-3/4 items-center justify-center">
        <div className="flex h-screen self-center animate-cw-spin">
          {profiles.map((profile, index) => (
            <ProfileTile
              profile={profile}
              itemCount={profiles.length}
              index={index}
              onClick={() => handleProfileClick(profile)}
              size={size}
            />
          ))}
        </div>

        <div className="absolute flex w-full h-full top-0 right-0 items-center justify-center pointer-events-none">
          <div
            className={`relative flex h-24 w-24 rounded-full ${
              selectedProfiles.length === 4 && "animate-exp-spin"
            }`}
            style={{
              backgroundImage: `url(${JTLogo})`,
              backgroundSize: "cover",
            }}
          >
            {selectedProfiles.length > 0 && selectedProfiles.length !== 4 && (
              <Button
                className="absolute px-[0.7rem] py-[0.3rem] -bottom-1 -right-1 text-xl z-10 pointer-events-auto opacity-80"
                onClick={() => setSelectedProfiles([])}
              >
                &times;
              </Button>
            )}
            {selectedProfiles.map((profile, index) => (
              <img
                key={profile.id}
                src={`${apiUrl}/pave/profilepics/${profile.name.toLowerCase()}.jpeg`}
                alt={profile.name}
                className="absolute w-18 h-18 rounded-3xl shadow-lg shadow-slate-600"
                style={{
                  left: `calc(50% + ${
                    radius * Math.cos((2 * Math.PI * index) / 4)
                  }px)`,
                  top: `calc(50% + ${
                    radius * Math.sin((2 * Math.PI * index) / 4)
                  }px)`,
                  transform: "translate(-50%, -50%)",
                  ...(!randomize && {
                    boxShadow: `${
                      index < 2 ? "0px 0px 30px blue" : "0px 0px 30px red"
                    }`,
                  }),
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="w-1/6 bg-purple-700 p-4">
        <Button
          onClick={() => setRandomize(!randomize)}
          className={randomize ? "bg-green-500" : ""}
        >
          Random
        </Button>
      </div>
    </div>
  );
};
