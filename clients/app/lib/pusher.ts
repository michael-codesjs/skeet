import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export const getPusherClient = () => {
  if (typeof window === 'undefined') return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

  if (!key) {
    console.warn('[Pusher] Missing Pusher Key');
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
    console.log('[Pusher] Connection initialized.');
  }

  return pusherInstance;
};
