import { useState } from 'endr';

import Input from '#src/components/input.js';
import disk from '#src/constants/disk.js';
import pave from '#src/constants/pave.js';
import rootContextQuery from '#src/constants/root-context-query.js';
import useAsync from '#src/hooks/use-async.js';
import useNotification from '#src/hooks/use-notification.js';
import useRootContext from '#src/hooks/use-root-context.js';

export default ({ onLogin }) => {
  const {
    location: { pathname }
  } = useRootContext();
  const [details, setDetails] = useState({});
  const isLogin = pathname === '/login';

  const { execute, error } = useAsync(async () => {
    let data;
    if (isLogin) {
      data = await pave.execute({
        query: {
          createGrant: {
            $: {
              emailAddress: details.emailAddress,
              password: details.password
            },
            createdGrant: { ...rootContextQuery.currentGrant, secret: {} }
          }
        }
      });
    } else {
      if (details.password !== details.passwordConfirmation) {
        throw new Error('Passwords do not match');
      }

      await pave.execute({
        query: {
          createPlayer: {
            $: {
              name: details.name,
              emailAddress: details.emailAddress,
              password: details.password
            }
          }
        }
      });

      data = await pave.execute({
        query: {
          createGrant: {
            $: {
              emailAddress: details.emailAddress,
              password: details.password
            },
            createdGrant: { ...rootContextQuery.currentGrant, secret: {} }
          }
        }
      });
    }

    disk.set('grantKey', data.createGrant.createdGrant.secret);
    onLogin();
  });
  useNotification(error);

  return (
    <div className='flex flex-col items-center justify-center grow'>
      <form
        onsubmit={ev => {
          ev.preventDefault();
          execute();
        }}
        className='border rounded p-4 text-center space-y-4'
      >
        <img src='/spikelogo.png' className='h-24' />
        {!isLogin && (
          <Input
            placeholder='Name'
            required
            className='w-full'
            value={details.name ?? ''}
            onchange={({ target: { value } }) =>
              setDetails(prev => ({ ...prev, name: value }))
            }
          />
        )}
        <Input
          placeholder='Email'
          required
          className='w-full'
          value={details.emailAddress ?? ''}
          type='email'
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, emailAddress: value }))
          }
        />
        <Input
          placeholder='Password'
          required
          className='w-full'
          value={details.password ?? ''}
          type='password'
          onchange={({ target: { value } }) =>
            setDetails(prev => ({ ...prev, password: value }))
          }
        />
        {!isLogin && (
          <Input
            placeholder='Confirm Password'
            required
            className='w-full'
            value={details.passwordConfirmation ?? ''}
            type='password'
            onchange={({ target: { value } }) =>
              setDetails(prev => ({ ...prev, passwordConfirmation: value }))
            }
          />
        )}
        <button
          type='submit'
          className='bg-orange-500 hover:bg-orange-600 text-center transition-colors text-white rounded p-2 w-full'
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
        <a
          className='block text-orange-500 hover:text-orange-600 transition-colors text-xs'
          href={isLogin ? '/register' : '/login'}
        >
          {isLogin ? "Don't" : 'Already'} have an account?
        </a>
      </form>
    </div>
  );
};
