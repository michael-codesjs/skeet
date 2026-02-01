'use client';

import { GET_PROJECTS } from '@/graphql/queries/projects';
import { useQuery } from '@apollo/client/react';
import { motion } from 'framer-motion';
import { Add, Clock, Folder, MagicStar, SearchNormal1, VideoPlay } from 'iconsax-react';
import Link from 'next/link';
import { useState } from 'react';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
}

// Types for the query response
type Project = {
  id: string;
  title: string;
  createdAt: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  media: { thumbnail: string | null }[];
};

type GetProjectsData = {
  projects: Project[];
};

export default function ProjectsPage() {
  const { data, loading, error } = useQuery<GetProjectsData>(GET_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search
  const filteredProjects = data?.projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-neutral-500 font-mono text-sm animate-pulse">
            Loading your masterpieces...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <MagicStar size={32} color="currentColor" className="text-red-500" variant="Bulk" />
          </div>
          <h3 className="text-xl font-bold text-white">Something went wrong</h3>
          <p className="text-neutral-400">
            We couldn't load your projects. Please try refreshing or checking your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-white text-black font-medium hover:bg-neutral-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasProjects = filteredProjects && filteredProjects.length > 0;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-display">
            Projects
          </h1>
          <p className="text-neutral-400 max-w-lg">
            Manage your stories, view processing status, and jump back into the edit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <SearchNormal1
              size={18}
              color="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 focus:bg-neutral-800 w-full md:w-64 transition-all"
            />
          </div>

          {/* New Project Button */}
          <Link href="/projects/new">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl">
              <span>Create New</span>
              <Add size={20} color="currentColor" className="text-black" />
            </button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {!hasProjects && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 px-4 rounded-3xl border border-dashed border-white/10 bg-neutral-900/20 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-linear-to-b from-neutral-800 to-neutral-900 flex items-center justify-center mb-6 shadow-2xl border border-white/5">
            <VideoPlay size={40} color="currentColor" className="text-neutral-500" variant="Bulk" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 font-display">No projects yet</h3>
          <p className="text-neutral-400 max-w-sm mb-8 text-lg">
            Ready to create? Upload your raw footage and let Skeet handle the rest.
          </p>
          <Link href="/projects/new">
            <button className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-colors">
              Start Creation
              <Add size={20} color="currentColor" className="text-black" />
            </button>
          </Link>
        </motion.div>
      )}

      {/* Search Empty State */}
      {!hasProjects && searchQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchNormal1 size={40} color="currentColor" className="text-neutral-700 mb-4" />
          <p className="text-neutral-400 text-lg">No projects found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-white underline underline-offset-4 hover:text-neutral-300"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {hasProjects && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project, index) => {
            const clips = project.media?.filter((c) => c.thumbnail) || [];
            const thumbnailCount = clips.length;

            return (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative flex flex-col h-full bg-neutral-900/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Header / Thumbnail Placeholder */}
                  <div className="h-32 bg-linear-to-br from-neutral-800 to-neutral-900 border-b border-white/5 p-4 flex items-start justify-between relative overflow-hidden group-hover:border-b-white/10 transition-colors">
                    {/* Mosaic Thumbnails */}
                    {thumbnailCount > 0 && (
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-neutral-950">
                        {clips.slice(0, 4).map((clip, i) => (
                          <div
                            key={i}
                            className={`relative overflow-hidden ${
                              thumbnailCount === 1
                                ? 'col-span-2 row-span-2'
                                : thumbnailCount === 2
                                  ? 'col-span-1 row-span-2'
                                  : thumbnailCount === 3 && i === 0
                                    ? 'col-span-2 row-span-1'
                                    : ''
                            }`}
                          >
                            {clip.thumbnail && (
                              <img
                                src={clip.thumbnail}
                                alt={`Thumbnail ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                              />
                            )}
                            {/* Dark gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Gradient Fallback (only if no thumbnails) */}
                    {thumbnailCount === 0 && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white to-transparent" />
                    )}

                    {/* Folder Icon (Only show if no thumbnails to keep it clean) */}
                    {thumbnailCount === 0 ? (
                      <div className="w-10 h-10 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/5 z-10 transition-transform group-hover:scale-110">
                        <Folder
                          size={20}
                          color="currentColor"
                          className="text-neutral-400 group-hover:text-white transition-colors"
                          variant="Bulk"
                        />
                      </div>
                    ) : (
                      // Empty div to keep flex justify-between working for the status badge
                      <div />
                    )}

                    {/* Status Badge */}
                    <div
                      className={`z-10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md ${
                        project.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400 border-green-500/20'
                          : project.status === 'PROCESSING'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/20'
                            : 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50'
                      }`}
                    >
                      {project.status.toLowerCase()}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col grow">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-white/90 transition-colors">
                      {project.title}
                    </h3>

                    <div className="mt-auto flex items-center gap-2 text-xs text-neutral-500 font-mono">
                      <Clock size={12} color="currentColor" className="text-neutral-600" />
                      <span>Updated {timeAgo(project.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
