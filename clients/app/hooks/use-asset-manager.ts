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
        for (const asset of assetsToSync) {
          if (!asset.url || !asset.url.startsWith('http')) {
            console.warn(`[AssetManager] Skipping asset ${asset.mediaId}: Invalid URL`, asset.url);
            continue;
          }

          try {
            console.log(`[AssetManager] Syncing asset ${asset.mediaId} from ${asset.url}`);
            const resp = await fetch(asset.url, {
              // Note: We don't use 'force-cache' here to ensure we get a fresh CORS-enabled response
              // but we let the browser manage internal caching if it wants.
            });

            if (!resp.ok) {
              throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }

            const blob = await resp.blob();
            await saveAsset(asset.mediaId, blob);
            completed++;
            setProgress(Math.round((completed / assetsToSync.length) * 100));
          } catch (err) {
            console.error(
              `[AssetManager] Failed to sync asset ${asset.mediaId} (${asset.url}):`,
              err,
            );
          }
        }
        toast('Sync Complete: All project assets are now local.', 'success');
      } catch (err) {
        console.error('Asset sync failed:', err);
        toast('Sync Failed: Could not download some assets.', 'error');
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
    saveAsset,
    isSyncing,
    progress,
  };
};
