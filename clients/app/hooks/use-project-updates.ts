import Pusher from 'pusher-js';
import { useEffect, useRef } from 'react';

export const useProjectUpdates = (
  projectId: string | undefined,
  onAssetUpdated: (data: any) => void,
) => {
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Initialize Pusher
    // Note: In a real app, these keys should come from env vars
    // NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'YOUR_PUSHER_KEY';
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (pusherKey === 'YOUR_PUSHER_KEY') {
      console.warn('[Pusher] No Pusher key provided. Real-time updates disabled.');
      return;
    }

    pusherRef.current = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channelName = `project-${projectId}`;
    const channel = pusherRef.current.subscribe(channelName);

    console.log(`[Pusher] Subscribed to ${channelName}`);

    channel.bind('asset-updated', (data: any) => {
      console.log('[Pusher] Received asset-updated:', data);
      onAssetUpdated(data);
    });

    channel.bind('project-updated', (data: any) => {
      console.log('[Pusher] Received project-updated:', data);
      onAssetUpdated(data);
    });

    return () => {
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(channelName);
        pusherRef.current.disconnect();
      }
    };
  }, [projectId, onAssetUpdated]);
};
