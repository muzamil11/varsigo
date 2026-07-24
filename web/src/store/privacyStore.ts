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

// See authStore.ts's comment above — `.persist` is undefined during SSR
// since there's no localStorage to back it, so this is guarded.
usePrivacyStore.persist?.onFinishHydration(() => {
  usePrivacyStore.setState({ hasHydrated: true });
});
