'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isAdminEmail } from '@/lib/admin';
import type { UserRow } from '@/lib/database.types';

interface AuthState {
  firebaseUid: string | null;
  user: UserRow | null;
  hasHydrated: boolean;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  setUser: (firebaseUid: string, user: UserRow) => void;
  updateUser: (user: UserRow) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      firebaseUid: null,
      user: null,
      hasHydrated: false,
      isAuthenticated: () => Boolean(get().firebaseUid && get().user),
      isAdmin: () => isAdminEmail(get().user?.email),
      setUser: (firebaseUid, user) => set({ firebaseUid, user }),
      updateUser: (user) => set({ user }),
      logout: () => set({ firebaseUid: null, user: null }),
    }),
    {
      name: 'varsigo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ firebaseUid: state.firebaseUid, user: state.user }),
    },
  ),
);

// Lets pages tell "still loading from disk" apart from "loaded, and there's
// no user" before deciding whether to redirect to login or render content.
// `.persist` is only attached when the persist middleware could resolve a
// storage backend — during SSR there's no `localStorage`, so this is
// guarded rather than called unconditionally.
useAuthStore.persist?.onFinishHydration(() => {
  useAuthStore.setState({ hasHydrated: true });
});

// Safety net: some browser setups (privacy/tracking-protection extensions,
// storage-partitioning, private-browsing storage restrictions) can prevent
// the persist hydration callback above from ever firing, which would leave
// every gated page stuck on its loading skeleton forever. Force-resolve
// after a short delay so the app always treats a stuck hydration as "no
// user" rather than hanging indefinitely.
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useAuthStore.getState().hasHydrated) {
      console.warn(
        '[authStore] Hydration from localStorage did not complete in time — proceeding as signed out. ' +
          'This usually means a browser extension or privacy setting is blocking localStorage.',
      );
      useAuthStore.setState({ hasHydrated: true });
    }
  }, 1500);
}
