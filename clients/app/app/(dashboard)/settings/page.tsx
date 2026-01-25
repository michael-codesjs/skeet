'use client';

import { Input } from '@/components/ui/input';
import { Edit2, User } from 'iconsax-react';
import React, { useState } from 'react';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('Michael Phiri');
  const [email, setEmail] = useState('michael.codesjs@gmail.com');

  // Mock user data
  const user = {
    name: fullName,
    email: email,
    initials: 'M',
  };

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Settings</h1>
        <p className="text-neutral-400 text-lg">
          Manage your personal account details and preferences.
        </p>
      </div>

      {/* Content */}
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <User size={24} variant="Bold" color="currentColor" className="text-white" />
            Personal Information
          </h2>
          <p className="text-neutral-500 mt-1">Update your personal details and login security.</p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-10 ring-1 ring-white/10 max-w-4xl">
          {/* Profile Picture Section */}
          <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center text-3xl font-bold text-neutral-500 border border-white/10 relative group cursor-pointer overflow-hidden transition-all hover:border-white/30">
              {user.initials}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <Edit2 size={16} color="currentColor" className="text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  Edit
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-medium text-white">Profile Picture</h3>
              <button className="text-white/60 text-sm font-medium hover:text-white transition-colors flex items-center gap-2">
                Upload New Image
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          <div className="grid gap-8 max-w-2xl">
            <Input
              id="fullName"
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 max-w-4xl justify-end">
          <button className="px-8 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
