'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { Sms } from 'iconsax-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'forget-password',
      });

      if (error) {
        setError(error.message || 'Failed to send reset code');
      } else {
        setSent(true);
        // Redirect to reset password page with email
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
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
        <h1 className="text-3xl font-bold mb-3 tracking-tight text-gradient">Forgot Password</h1>
        <p className="text-neutral-400 text-sm font-medium">
          Enter your email to receive a reset code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Sms size={20} color="currentColor" />}
          required
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending Code...' : 'Send Reset Code'}
        </Button>

        <div className="text-center">
          <Link
            href="/sign-in"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
