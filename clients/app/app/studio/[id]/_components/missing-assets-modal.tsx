'use client';

import { AssetStatus } from '@/hooks/use-asset-manager';
import { Warning2 } from 'iconsax-react';

interface MissingAssetsModalProps {
  missingAssets: AssetStatus[];
  onSync: () => void;
  isSyncing: boolean;
  progress: number;
}

export function MissingAssetsModal({
  missingAssets,
  onSync,
  isSyncing,
  progress,
}: MissingAssetsModalProps) {
  if (missingAssets.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500">
            <Warning2 size={32} variant="Bold" color="currentColor" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Missing Local Assets</h2>
          <p className="text-neutral-400">
            {missingAssets.length} media files found in this project are not on your local machine.
            Syncing them will download proxies to your browser for smooth editing.
          </p>
        </div>

        <div className="mb-8 max-h-40 overflow-y-auto rounded-lg bg-black/20 p-4">
          {missingAssets.map((asset) => (
            <div
              key={asset.mediaId}
              className="flex items-center gap-3 py-2 text-sm text-neutral-300"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="truncate">Media ID: {asset.mediaId}</span>
            </div>
          ))}
        </div>

        {isSyncing ? (
          <div className="space-y-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm font-medium text-blue-400">
              Syncing Assets... {progress}%
            </p>
          </div>
        ) : (
          <button
            onClick={onSync}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="h-2 w-2 rounded-full bg-black/20" />
            Download Project Assets
          </button>
        )}
      </div>
    </div>
  );
}
