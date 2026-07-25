'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PrivacyState {
  accepted: boolean;
  hasHydrated: boolean;
  accept: () => void;
}

/** Whether the user has accepted the Privacy Notice (app/privacy-notice),
 *  shown once right after name entry, before the rest of the app. Persisted
 *  so it's never shown again after the first acceptance. */
export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      accepted: false,
      hasHydrated: false,
      accept: () => set({ accepted: true }),
    }),
    {
      name: 'varsigo-privacy',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ accepted: state.accepted }),
    },
  ),
);

// See authStore.ts's comments above — `.persist` is undefined during SSR,
// and the timeout is a safety net in case a browser setup prevents the
// hydration callback from ever firing.
usePrivacyStore.persist?.onFinishHydration(() => {
  usePrivacyStore.setState({ hasHydrated: true });
});

if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!usePrivacyStore.getState().hasHydrated) {
      usePrivacyStore.setState({ hasHydrated: true });
    }
  }, 1500);
}
