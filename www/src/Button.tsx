import { useState } from "endr";

export default function Button({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: string;
  className: string;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  return (
    <button
      onClick={onClick}
      onPointerDown={handleMouseDown}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`px-4 py-2 rounded-md text-white text-center align-middle transition-shadow 
                  ${isPressed ? "bg-gray-600 scale-[0.98]" : "bg-gray-500"} 
                  ${className}`}
    >
      {children}
    </button>
  );
}
