import { useState } from 'endr';

import Icon from '#src/components/icon.js';
import Input from '#src/components/input.js';
import notificationsApi from '#src/constants/notifications.js';
import pave from '#src/constants/pave.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useRootContext from '#src/hooks/use-root-context.js';

export default ({ reload }) => {
  const { player } = useRootContext();
  const [details, setDetails] = useState({
    name: player.name,
    nickname: player.nickname
  });

  const { execute, error } = useAsync(async () => {
    if (details.password !== details.passwordConfirmation) {
      throw new Error('Passwords do not match');
    }

    await pave.execute({
      query: {
        updatePlayer: {
          $: {
            id: player.id,
            name: details.name,
            nickname: details.nickname,
            password: details.password
          }
        }
      }
    });

    notificationsApi.add({
      type: 'success',
      children: 'Profile settings updated successfully.'
    });

    reload();
  });
  useNotification(error);

  return (
    <div className='p-8 space-y-4'>
      {player.isAdmin && (
        <a
          href='/'
          className='block cursor-pointer text-orange-500 hover:text-orange-600'
        >
          <Icon
            name='arrow-left'
            className='h-4 inline-block stroke-currentColor align-[-0.125rem]'
          />{' '}
          Back to App
        </a>
      )}
      <div className='space-y-2'>
        <div className='text-xl font-semibold'>Profile</div>
        <img
          className='h-24 w-24 rounded-xl shadow-md shadow-slate-600 active:shadow-sm'
          src={player.avatarUrl}
          alt={player.name}
        />
        <a
          href='https://gravatar.com/profile'
          className='bg-white block text-xs hover:bg-gray-50 rounded border px-2 py-1 w-24 text-center'
        >
          Change
        </a>
      </div>
      <form
        onsubmit={ev => {
          ev.preventDefault();
          execute();
        }}
        className='border rounded p-4 text-center space-y-4 max-w-prose'
      >
        <Input
          placeholder='Name'
          required
          className='w-full'
          value={details.name ?? ''}
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, name: value }))
          }
        />
        <Input
          placeholder='Nickname'
          className='w-full'
          value={details.nickname ?? ''}
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, nickname: value }))
          }
        />
        <Input
          placeholder='Password'
          className='w-full'
          value={details.password ?? ''}
          type='password'
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, password: value }))
          }
        />
        <Input
          placeholder='Confirm Password'
          className='w-full'
          value={details.passwordConfirmation ?? ''}
          type='password'
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, passwordConfirmation: value }))
          }
        />
        <button
          type='submit'
          className='bg-orange-500 hover:bg-orange-600 text-center transition-colors text-white rounded p-2 w-full'
        >
          Update
        </button>
      </form>
    </div>
  );
};