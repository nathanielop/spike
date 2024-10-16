import UserAvatar from '#src/components/user-avatar.js';

export default ({ profile }) => (
  <UserAvatar
    player={profile}
    className='h-[16rem]'
    textClassName='text-base'
  />
);
