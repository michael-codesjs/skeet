'use client';

import { DocumentUpload, Folder } from 'iconsax-react';

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Media Library</h1>
          <p className="text-neutral-400 mt-1">Organize your raw footage and assets.</p>
        </div>

        <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
          <DocumentUpload size={20} color="currentColor" />
          Upload Media
        </button>
      </div>

      {/* Quick Access Folders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['All Media', 'Favorites', 'Recent Imports', 'Archived'].map((folder, i) => (
          <div
            key={folder}
            className="bg-[#111111] border border-white/5 p-4 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Folder size={24} variant="Bulk" color="currentColor" className="text-neutral-400" />
            <span className="text-sm font-medium text-white">{folder}</span>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <DocumentUpload size={32} color="currentColor" className="text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No media found</h3>
        <p className="text-neutral-400 text-sm max-w-xs mx-auto mb-6">
          Upload your footage to start scouting and editing with Skeet.
        </p>
        <button className="text-sm text-white underline underline-offset-4 hover:text-neutral-300">
          Import from Cloud
        </button>
      </div>
    </div>
  );
}
