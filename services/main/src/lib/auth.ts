import { PrismaClient } from '@/generated/prisma_client';
import { resend } from '@/lib/resend';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';

import { OtpEmailHtml } from './email/templates/otp';
import { ResetPasswordEmailHtml } from './email/templates/reset-password';

const prisma = new PrismaClient();

export const auth = betterAuth({
  basePath: '/api/auth',
  trustedOrigins: [
    'skeet://',
    'exp://',
    'http://localhost:5556',
    'https://skeet-michael-codesjs.koyeb.app',
    'https://skeet-app.vercel.app',
    'https://comprehensive-flori-skeet-f31dc0c6.koyeb.app',
  ], // Added exp:// for Expo Go and shops app
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url, token }) {
      // Log in development or if NODE_ENV is unset
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        console.log(
          `\n\n=== Reset Password Token for ${user.email} ===\nToken: ${token}\nURL: ${url}\n========================\n\n`,
        );
      }

      let link = url;
      try {
        const urlObj = new URL(url);
        const callbackURL = urlObj.searchParams.get('callbackURL');
        if (callbackURL) {
          link = `${callbackURL}?token=${token}`;
        }
      } catch (e) {
        // ignore parsing errors
      }

      try {
        const { data, error } = await resend.emails.send({
          from: 'info@usezeiro.com',
          to: user.email,
          subject: 'Reset Your Password',
          html: ResetPasswordEmailHtml(link),
        });

        if (error) {
          console.error('❌ Failed to send reset password email (Resend Error):', error);
        } else {
          console.log('✅ Reset password email sent successfully to:', user.email, 'ID:', data?.id);
        }
      } catch (error) {
        console.error('❌ Unexpected error sending reset password email:', error);
      }
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[Auth Debug] sendVerificationOTP triggered for ${email} with type ${type}`);
        // Log in development or if NODE_ENV is unset
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.log(`\n\n=== OTP for ${email} ===\nCode: ${otp}\n========================\n\n`);
        }

        if (!process.env.RESEND_API_KEY) {
          console.error(
            '❌ RESEND_API_KEY is missing in environment variables. Cannot send email.',
          );
          return;
        }

        let subject = 'Your Verification Code';
        let title = 'Verify your email';
        let message =
          'Use the code below to complete your sign in or sign up process. This code will expire in 10 minutes.';

        if (type === 'forget-password') {
          subject = 'Reset Your Password';
          title = 'Reset your password';
          message =
            'Use the code below to reset your password. This code will expire in 10 minutes.';
        }

        try {
          const { data, error } = await resend.emails.send({
            from: 'info@usezeiro.com',
            to: email, // NOTE: On free tier, this only works if 'email' is the same as your Resend account email
            subject,
            html: OtpEmailHtml(otp, title, message),
          });

          if (error) {
            console.error('❌ Failed to send OTP email (Resend Error):', error);
          } else {
            console.log('✅ OTP email sent successfully to:', email, 'ID:', data?.id);
          }
        } catch (error) {
          console.error('❌ Unexpected error sending OTP email:', error);
        }
      },
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
      strategy: 'jwt', // can be "jwt" or "compact"
      refreshCache: true, // Enable stateless refresh
    },
  },
  account: {
    storeStateStrategy: 'cookie',
    storeAccountCookie: true, // Store account data after OAuth flow in a cookie (useful for database-less flows)
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});
