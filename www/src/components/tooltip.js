export default ({ tooltip, children }) => (
  <div className='relative group/tooltip'>
    {children}
    {tooltip && (
      <div className='absolute z-20 hidden top-[-100%] left-[50%] group-hover/tooltip:block bg-black text-white text-xs p-1 rounded-md whitespace-nowrap'>
        {tooltip}
      </div>
    )}
  </div>
);
