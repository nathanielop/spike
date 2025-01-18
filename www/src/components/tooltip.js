export default ({ tooltip, children }) => (
  <div className='relative group/tooltip'>
    {children}
    <div className='absolute z-10 hidden top-[-100%] group-hover/tooltip:block bg-black text-white text-xs p-2 rounded-md whitespace-nowrap'>
      {tooltip}
    </div>
  </div>
);
