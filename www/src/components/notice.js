import CircleAlert from '#src/components/icons/circle-alert.js';

export default ({ children }) => (
  <div className='w-full p-2 text-left'>
    <div className='w-full bg-red-500 shadow rounded text-white'>
      <div className='p-2 space-x-1 w-full font-bold flex items-center'>
        <CircleAlert className='h-5 text-white' />{' '}
        <span className='leading-none'>Error</span>
      </div>
      <div className='p-2 bg-black bg-opacity-10'>{children.message}</div>
    </div>
  </div>
);
