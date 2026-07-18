import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from '@firebase/auth';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import {
  AnimatedListItem,
  Card,
  CardSkeletonList,
  Screen,
  SearchBar,
  StateMessage,
  ThemeToggle,
} from '@/components';
import { upsertUserByPhone } from '@/features/auth/api';
import { fetchPapers } from '@/features/papers/api';
import type { Paper } from '@/features/papers/data';
import { PaperCard } from '@/features/papers/PaperCard';
import { fetchTeachers } from '@/features/teachers/api';
import type { TeacherListItem } from '@/features/teachers/data';
import { TeacherCard } from '@/features/teachers/TeacherCard';
import { firebaseAuth } from '@/lib/firebase';
import {
  callDeleteAccountFunction,
  isDeleteAccountFunctionConfigured,
} from '@/lib/accountFunction';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

const QUICK_ACTIONS = [
  {
    title: 'Teachers',
    subtitle: 'Ratings & reviews',
    icon: 'people' as const,
    href: '/teachers' as const,
  },
  {
    title: 'Past Papers',
    subtitle: 'PDFs & notes',
    icon: 'document-text' as const,
    href: '/papers' as const,
  },
  {
    title: 'Help',
    subtitle: 'FAQ & questions',
    icon: 'chatbubble-ellipses' as const,
    href: '/faq' as const,
  },
];

const RECENT_PAPERS_COUNT = 3;
const TOP_TEACHERS_COUNT = 3;

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const userName = useAuthStore((s) => s.user?.name);
  const userPhone = useAuthStore((s) => s.user?.phone);
  const [query, setQuery] = useState('');
  const [allTeachers, setAllTeachers] = useState<TeacherListItem[]>([]);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(firebaseAuth);
          } catch {
            // Firebase session isn't persisted anyway (see src/lib/firebase.ts) —
            // the app's own authStore below is the real "logged in" source of truth.
          }
          useAuthStore.getState().logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (!isDeleteAccountFunctionConfigured()) {
      Alert.alert(
        'Account deletion not configured',
        'Deploy the delete-account function and set EXPO_PUBLIC_DELETE_ACCOUNT_FUNCTION_URL before release.',
      );
      return;
    }

    Alert.alert(
      'Delete account?',
      'Your profile and phone link will be deleted. Approved reviews and uploads stay visible without your account attached.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              await callDeleteAccountFunction();
              await signOut(firebaseAuth).catch(() => undefined);
              useAuthStore.getState().logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert(
                'Could not delete account',
                error instanceof Error ? error.message : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const load = useCallback(async (isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoaded.current;
    shouldShowSkeleton ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      if (userPhone) {
        const currentUser = await upsertUserByPhone(userPhone);
        useAuthStore.getState().updateUser(currentUser);
      }
      const [teachers, papers] = await Promise.all([fetchTeachers(), fetchPapers()]);
      setAllTeachers(teachers);
      setAllPapers(papers);
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      shouldShowSkeleton ? setLoading(false) : setRefreshing(false);
    }
  }, [userPhone]);

  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current);
    }, [load]),
  );

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const matchedTeachers = useMemo(
    () =>
      isSearching
        ? allTeachers.filter(
            (t) =>
              t.name.toLowerCase().includes(trimmedQuery) ||
              (t.department ?? '').toLowerCase().includes(trimmedQuery) ||
              t.courses.some(
                (course) =>
                  course.name.toLowerCase().includes(trimmedQuery) ||
                  (course.code ?? '').toLowerCase().includes(trimmedQuery),
              ),
          )
        : [],
    [allTeachers, trimmedQuery, isSearching],
  );

  const matchedPapers = useMemo(
    () =>
      isSearching
        ? allPapers.filter(
            (p) =>
              p.title.toLowerCase().includes(trimmedQuery) ||
              p.subject.toLowerCase().includes(trimmedQuery),
          )
        : [],
    [allPapers, trimmedQuery, isSearching],
  );

  const topTeachers = useMemo(
    () => [...allTeachers].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)).slice(0, TOP_TEACHERS_COUNT),
    [allTeachers],
  );

  const recentPapers = useMemo(() => allPapers.slice(0, RECENT_PAPERS_COUNT), [allPapers]);

  return (
    <Screen>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
      >
        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-muted dark:text-muted-dark">NED University</Text>
            <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
              {userName ? `Hi, ${userName} 👋` : 'Varsigo'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <ThemeToggle />
            <Pressable
              onPress={handleLogout}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-card dark:border-line-dark dark:bg-card-dark"
            >
              <Ionicons name="log-out-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View className="mt-4">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search teachers, courses, papers..."
          />
        </View>

        {loading ? (
          <CardSkeletonList count={3} padded={false} />
        ) : error ? (
          <StateMessage
            icon="cloud-offline-outline"
            title="Couldn't load data"
            subtitle={error}
            onRetry={load}
          />
        ) : isSearching ? (
          <>
            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Teachers
            </Text>
            {matchedTeachers.length === 0 ? (
              <StateMessage icon="people-outline" title="No matching teachers" />
            ) : (
              matchedTeachers.map((teacher, i) => (
                <AnimatedListItem key={teacher.id} index={i}>
                  <TeacherCard
                    teacher={teacher}
                    onPress={() => router.push(`/teachers/${teacher.id}`)}
                  />
                </AnimatedListItem>
              ))
            )}

            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Papers
            </Text>
            {matchedPapers.length === 0 ? (
              <StateMessage icon="document-text-outline" title="No matching papers" />
            ) : (
              matchedPapers.map((paper, i) => (
                <AnimatedListItem key={paper.id} index={i}>
                  <PaperCard paper={paper} onPress={() => router.push('/papers')} />
                </AnimatedListItem>
              ))
            )}
          </>
        ) : (
          <>
            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Explore
            </Text>
            <View className="flex-row gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Card
                  key={action.title}
                  onPress={() => router.push(action.href)}
                  className="flex-1 items-start"
                >
                  <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
                    <Ionicons name={action.icon} size={20} color="#6366F1" />
                  </View>
                  <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                    {action.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                    {action.subtitle}
                  </Text>
                </Card>
              ))}
            </View>

            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Top rated teachers
            </Text>
            {topTeachers.length === 0 ? (
              <StateMessage icon="people-outline" title="No teachers yet" />
            ) : (
              topTeachers.map((teacher, i) => (
                <AnimatedListItem key={teacher.id} index={i}>
                  <TeacherCard
                    teacher={teacher}
                    onPress={() => router.push(`/teachers/${teacher.id}`)}
                  />
                </AnimatedListItem>
              ))
            )}

            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Recently Added Papers
            </Text>
            {recentPapers.length === 0 ? (
              <StateMessage
                icon="document-text-outline"
                title="No papers yet"
                subtitle="Uploaded papers and notes will show up here."
              />
            ) : (
              recentPapers.map((paper, i) => (
                <AnimatedListItem key={paper.id} index={i}>
                  <PaperCard paper={paper} onPress={() => router.push('/papers')} />
                </AnimatedListItem>
              ))
            )}

            <Text className="mb-3 mt-6 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Account
            </Text>
            <Pressable
              onPress={handleDeleteAccount}
              className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3"
            >
              <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                Delete my account
              </Text>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                Removes your profile and keeps approved community content anonymous.
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
