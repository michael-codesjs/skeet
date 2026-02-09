import { authClient } from '@/lib/auth-client';
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSession: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
  }) => Promise<{ error: string | null }>;
  launchDemo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  launchDemo: async () => {
    const { session, signIn } = get();
    if (session) {
      window.location.href = process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/';
      return;
    }

    set({ isLoading: true });
    try {
      const email = 'michael.codesjs@gmail.com';
      const password = 'football';
      const { error } = await signIn({ email, password });
      if (!error) {
        window.location.href = process.env.NEXT_PUBLIC_APP_CLIENT_URL || '/';
      }
    } catch (err) {
      console.error('Launch failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await authClient.getSession();
      if (error) {
        set({ error: error.message, user: null, session: null });
      } else {
        set({ user: data?.user as User, session: data?.session as Session });
      }
    } catch (e) {
      set({ error: 'Failed to fetch session' });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authClient.signOut();
      set({ user: null, session: null });
    } catch (e) {
      set({ error: 'Failed to sign out' });
    } finally {
      set({ isLoading: false });
    }
  },
  signIn: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        set({ error: error.message || 'Unknown error', isLoading: false });
        return { error: error.message || 'Unknown error' };
      }

      // Fetch session immediately after login to ensure state is sync
      await get().fetchSession();
      return { error: null };
    } catch (e) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },

  signUp: async ({ email, password, name }) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        set({ error: error.message || 'Unknown error', isLoading: false });
        return { error: error.message || 'Unknown error' };
      }

      set({ isLoading: false });
      return { error: null };
    } catch (e) {
      set({ error: 'An unexpected error occurred', isLoading: false });
      return { error: 'An unexpected error occurred' };
    }
  },
}));
