'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        setError(error.message || 'Failed to verify email');
      } else {
        // Redirect to external app
        const appUrl = process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/';
        window.location.href = appUrl;
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-10 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-3xl shadow-2xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-gradient">Verify Email</h1>
        <p className="text-neutral-400 text-sm font-medium">Enter the code sent to {email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Verification Code"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="text-center tracking-widest text-lg"
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </Button>
      </form>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
