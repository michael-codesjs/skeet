import { getPusherClient } from '@/lib/pusher';
import { useEffect, useRef } from 'react';

export const useProjectUpdates = (
  projectId: string | undefined,
  onAssetUpdated: (data: any) => void,
) => {
  const callbackRef = useRef(onAssetUpdated);

  useEffect(() => {
    callbackRef.current = onAssetUpdated;
  }, [onAssetUpdated]);

  useEffect(() => {
    if (!projectId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `project-${projectId}`;
    const channel = pusher.subscribe(channelName);

    console.log(`[Pusher] Subscribed to ${channelName}`);

    const handleUpdate = (data: any) => {
      console.log(`[Pusher] Received update on ${channelName}:`, data);
      callbackRef.current(data);
    };

    channel.bind('asset-updated', handleUpdate);
    channel.bind('project-updated', handleUpdate);

    return () => {
      console.log(`[Pusher] Unsubscribing from ${channelName}`);
      channel.unbind('asset-updated', handleUpdate);
      channel.unbind('project-updated', handleUpdate);
      pusher.unsubscribe(channelName);
    };
  }, [projectId]);
};
