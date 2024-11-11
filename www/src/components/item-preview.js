import UserIcon from '#src/components/icons/user.js';

export default ({ item }) => (
  <div className='absolute inset-0 p-2 flex items-center justify-center'>
    {item.type === 'avatarEffect' ? (
      <div
        className='flex items-center justify-center border-4 rounded p-2 w-2/3 aspect-square'
        style={item.attributes}
      >
        <UserIcon className='w-1/2 h-1/2 text-gray-300' />
      </div>
    ) : item.type === 'hat' ? (
      <div
        className='w-2/3 bg-center bg-no-repeat bg-contain h-2/3 m-auto'
        style={{ backgroundImage: `url("store/${item.attributes.src}")` }}
      />
    ) : (
      <div className='relative flex items-center justify-center rounded p-2 w-2/3 aspect-square border'>
        <UserIcon className='w-1/2 h-1/2 text-gray-300' />
        <div className='absolute p-1 text-xs shadow bg-white z-10 w-6 h-6 flex items-center justify-center -top-3 -left-3 rounded-full'>
          {item.attributes.children}
        </div>
      </div>
    )}
  </div>
);
