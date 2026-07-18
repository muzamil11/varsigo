import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PrivacyState {
  accepted: boolean;
  hasHydrated: boolean;
  accept: () => void;
}

/** Whether the user has accepted the Privacy Notice (src/app/privacy-notice.tsx),
 *  shown once right after name entry, before the app's Home tab. Persisted so
 *  it's never shown again after the first acceptance. */
export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      accepted: false,
      hasHydrated: false,
      accept: () => set({ accepted: true }),
    }),
    {
      name: 'campuslens-privacy',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ accepted: state.accepted }),
    },
  ),
);

usePrivacyStore.persist.onFinishHydration(() => {
  usePrivacyStore.setState({ hasHydrated: true });
});
