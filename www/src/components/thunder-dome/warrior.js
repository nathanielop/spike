import UserAvatar from '#src/components/user-avatar.js';

export default ({ profile }) => (
  <UserAvatar
    player={profile}
    showItems
    className='h-[16rem] aspect-square'
    textClassName='text-base'
  />
);
