import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button, Screen } from '@/components';
import { upsertUserByGoogle } from '@/features/auth/api';
import { signInWithGoogle } from '@/features/auth/google';
import { getPostAuthRoute } from '@/lib/routing';
import { useAuthStore } from '@/store/authStore';
import { usePrivacyStore } from '@/store/privacyStore';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser.email) {
        throw new Error('Your Google account has no email attached. Please try a different account.');
      }

      const supabaseUser = await upsertUserByGoogle({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
      });
      useAuthStore.getState().setUser(firebaseUser.uid, supabaseUser);
      router.replace(getPostAuthRoute(supabaseUser, usePrivacyStore.getState().accepted));
    } catch (error) {
      Alert.alert('Could not sign in', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center px-4">
        <View className="mb-10">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent">
            <Ionicons name="school" size={28} color="#FFFFFF" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Welcome to NEDHub
          </Text>
          <Text className="mt-2 text-base text-muted dark:text-muted-dark">
            Sign in with Google to continue
          </Text>
        </View>

        <Button label="Continue with Google" onPress={handleGoogleSignIn} loading={loading} />
      </View>
    </Screen>
  );
}
