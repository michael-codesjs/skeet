'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth';
import { Lock, Sms, User } from 'iconsax-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });

    if (error) {
      setError(error);
    } else {
      // Redirect to verify email page with email/query param to pre-fill
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    }
  };

  return (
    <div className="glass-card p-10 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-gradient">Create Account</h1>
        <p className="text-neutral-400 text-sm font-medium">Start your journey with Skeet</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          startIcon={<User size={20} color="currentColor" />}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          startIcon={<Sms size={20} color="currentColor" />}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          startIcon={<Lock size={20} color="currentColor" />}
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>

        <p className="text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-white hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
