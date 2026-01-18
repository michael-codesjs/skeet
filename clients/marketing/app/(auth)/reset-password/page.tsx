'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Lock } from 'iconsax-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    token: token,
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: formData.password,
        token: formData.token,
      });

      if (error) {
        setError(error.message || 'Failed to reset password');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-white/10 text-center">
        <h2 className="text-2xl font-bold mb-4 text-green-400">Success!</h2>
        <p className="text-neutral-300 mb-4">Your password has been reset successfully.</p>
        <p className="text-sm text-neutral-500">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-10 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-gradient">Reset Password</h1>
        <p className="text-neutral-400 text-sm font-medium">
          Create a new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Only show token input if not present in URL */}
        {!token && (
          <Input
            label="Reset Token"
            type="text"
            placeholder="Enter reset token"
            value={formData.token}
            onChange={(e) => setFormData({ ...formData, token: e.target.value })}
            className="text-center tracking-widest text-lg"
            required
          />
        )}

        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          startIcon={<Lock size={20} color="currentColor" />}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          startIcon={<Lock size={20} color="currentColor" />}
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
