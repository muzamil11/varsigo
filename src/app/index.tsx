import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components';
import { getPostAuthRoute } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';

/** In-app splash: brief brand moment, then routes onward — see
 *  getPostAuthRoute() for the login / name / privacy-notice / tabs logic. */
export default function SplashScreen() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const privacyHydrated = usePrivacyStore((s) => s.hasHydrated);
  const privacyAccepted = usePrivacyStore((s) => s.accepted);

  useEffect(() => {
    if (!hasHydrated || !privacyHydrated) return;
    const t = setTimeout(() => {
      router.replace(
        isAuthenticated ? getPostAuthRoute(user, privacyAccepted) : '/login',
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [hasHydrated, privacyHydrated, isAuthenticated, user, privacyAccepted, router]);

  return (
    <Screen className="items-center justify-center">
      <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent">
        <Ionicons name="school" size={40} color="#FFFFFF" />
      </View>
      <Text className="mt-6 text-4xl font-extrabold text-foreground dark:text-foreground-dark">
        NEDHub
      </Text>
      <Text className="mt-2 text-base text-muted dark:text-muted-dark">
        NED University&apos;s Student Platform
      </Text>
    </Screen>
  );
}
