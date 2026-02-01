import { useToast } from '@/components/ui/toast';
import { openDB } from 'idb';
import { useCallback, useState } from 'react';

const DB_NAME = 'skeet-assets';
const STORE_NAME = 'media';
const DB_VERSION = 1;

export interface AssetStatus {
  mediaId: string;
  isLocal: boolean;
  blobUrl?: string;
}

export const useAssetManager = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const getDB = useCallback(async () => {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }, []);

  const getAsset = useCallback(
    async (mediaId: string): Promise<Blob | null> => {
      const db = await getDB();
      return db.get(STORE_NAME, mediaId);
    },
    [getDB],
  );

  const saveAsset = useCallback(
    async (mediaId: string, blob: Blob) => {
      const db = await getDB();
      await db.put(STORE_NAME, blob, mediaId);
    },
    [getDB],
  );

  const checkAssets = useCallback(
    async (mediaIds: string[]): Promise<AssetStatus[]> => {
      const db = await getDB();
      const statuses = await Promise.all(
        mediaIds.map(async (id) => {
          const blob = await db.get(STORE_NAME, id);
          return {
            mediaId: id,
            isLocal: !!blob,
            blobUrl: blob ? URL.createObjectURL(blob) : undefined,
          };
        }),
      );
      return statuses;
    },
    [getDB],
  );

  const syncAssets = useCallback(
    async (assetsToSync: { mediaId: string; url: string }[]) => {
      setIsSyncing(true);
      setProgress(0);
      let completed = 0;

      try {
        await Promise.all(
          assetsToSync.map(async (asset) => {
            try {
              const resp = await fetch(asset.url);
              const blob = await resp.blob();
              await saveAsset(asset.mediaId, blob);
              completed++;
              setProgress(Math.round((completed / assetsToSync.length) * 100));
            } catch (err) {
              console.error(`Failed to sync asset ${asset.mediaId}:`, err);
            }
          }),
        );
        toast({ title: 'Sync Complete', description: 'All project assets are now local.' });
      } catch (err) {
        console.error('Asset sync failed:', err);
        toast({
          title: 'Sync Failed',
          description: 'Could not download some assets.',
          variant: 'destructive',
        });
      } finally {
        setIsSyncing(false);
        setProgress(0);
      }
    },
    [saveAsset, toast],
  );

  return {
    checkAssets,
    syncAssets,
    getAsset,
    isSyncing,
    progress,
  };
};
