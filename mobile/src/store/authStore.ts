import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi, type LoginResponse } from '../api/services';
import { extractApiError, setApiToken } from '../api/client';
import type { User } from '../types/domain';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'donor' | 'student' | 'admin';
  location?: string;
  phoneNumber?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (payload: RegisterPayload) => Promise<LoginResponse>;
  verifyTwoFactorLogin: (pendingToken: string, code: string) => Promise<LoginResponse>;
  resendTwoFactorLogin: (pendingToken: string) => Promise<LoginResponse>;
  bootstrapSession: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setSession: (payload: { user: User; token: string }) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,
      setHydrated: (value) => set({ hasHydrated: value }),
      setSession: ({ user, token }) => {
        setApiToken(token);
        set({ user, token });
      },
      clearSession: () => {
        setApiToken(null);
        set({ user: null, token: null });
      },
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          if (data.token && data.user) {
            get().setSession({ user: data.user, token: data.token });
          }
          return data;
        } catch (error) {
          throw new Error(extractApiError(error, 'Login failed'));
        } finally {
          set({ isLoading: false });
        }
      },
      register: async (payload) => {
        set({ isLoading: true });
        try {
          const data = await authApi.register(payload);
          if (data.token && data.user) {
            get().setSession({ user: data.user, token: data.token });
          }
          return data;
        } catch (error) {
          throw new Error(extractApiError(error, 'Registration failed'));
        } finally {
          set({ isLoading: false });
        }
      },
      verifyTwoFactorLogin: async (pendingToken, code) => {
        set({ isLoading: true });
        try {
          const data = await authApi.verifyTwoFactorLogin(pendingToken, code);
          if (data.token && data.user) {
            get().setSession({ user: data.user, token: data.token });
          }
          return data;
        } catch (error) {
          throw new Error(extractApiError(error, 'Two-factor verification failed'));
        } finally {
          set({ isLoading: false });
        }
      },
      resendTwoFactorLogin: async (pendingToken) => {
        try {
          return await authApi.resendTwoFactorLogin(pendingToken);
        } catch (error) {
          throw new Error(extractApiError(error, 'Failed to resend verification code'));
        }
      },
      bootstrapSession: async () => {
        const token = get().token;
        if (!token) {
          set({ hasHydrated: true });
          return;
        }

        setApiToken(token);
        try {
          const user = await authApi.getMe();
          set({ user, hasHydrated: true });
        } catch {
          get().clearSession();
          set({ hasHydrated: true });
        }
      },
      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        setApiToken(token);
        const user = await authApi.getMe();
        set({ user });
      },
    }),
    {
      name: 'bookshare-mobile-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiToken(state.token);
        }
        state?.setHydrated(true);
      },
    },
  ),
);
