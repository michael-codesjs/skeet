'use client';

import { motion } from 'framer-motion';
import { Add, Filter, SearchNormal1 } from 'iconsax-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-neutral-400 mt-1">Manage and edit your video stories.</p>
        </div>

        <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
          <Add size={20} color="currentColor" />
          New Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <SearchNormal1
            size={20}
            color="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full bg-[#111111] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-sm text-white hover:bg-white/5 transition-colors">
          <Filter size={18} color="currentColor" />
          Filter
        </button>
      </div>

      {/* Empty State / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative aspect-video bg-[#111111] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/30 transition-all hover:shadow-2xl"
          >
            {/* Thumbnail Placeholder */}
            <div className="absolute inset-0 bg-neutral-900 group-hover:scale-105 transition-transform duration-500" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-4">
              <h3 className="text-white font-medium truncate">Travel Vlog 2026 - Tokyo</h3>
              <p className="text-xs text-neutral-400 mt-1">Edited 2 hours ago</p>
            </div>
          </motion.div>
        ))}

        {/* New Project Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center justify-center aspect-video border border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors mb-3">
            <Add size={24} color="currentColor" className="text-white" />
          </div>
          <p className="text-sm font-medium text-white">Create New</p>
        </motion.div>
      </div>
    </div>
  );
}
