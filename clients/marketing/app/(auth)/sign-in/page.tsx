'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import { Lock, Sms } from 'iconsax-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, isLoading, error: storeError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Use local error state to handle form submission errors from store
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error } = await signIn({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setError(error);
    } else {
      // Redirect to external app
      const appUrl = process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/';
      window.location.href = appUrl;
    }
  };

  return (
    <div className="glass-card p-10 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-gradient">Welcome Back</h1>
        <p className="text-neutral-400 text-sm font-medium">Sign in to continue to Skeet</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          startIcon={<Sms size={20} color="currentColor" />}
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            startIcon={<Lock size={20} color="currentColor" />}
            required
          />
          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-neutral-400">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-white hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
