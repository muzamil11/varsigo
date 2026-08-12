import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AnimatedListItem, Button, Card, Screen, StateMessage } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { fetchTeacherById, reportReview } from '@/features/teachers/api';
import type { TeacherDetail } from '@/features/teachers/data';
import { RatingBar } from '@/features/teachers/RatingBar';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

function verificationLabel(status: TeacherDetail['verificationStatus']): string {
  switch (status) {
    case 'admin_verified':
      return 'Verified by admin';
    case 'suggestion_approved':
      return 'Approved suggestion';
    case 'unverified':
      return 'Unverified';
  }
}

export default function TeacherDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      setTeacher(await fetchTeacherById(id, userId));
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  // Re-fetches every time this screen regains focus — in particular, right
  // after coming back from add-review, so a just-submitted review's
  // "pending approval" card (below) appears immediately instead of only on
  // the next full remount.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleReport = (reviewId: string) => {
    Alert.alert('Report this review?', 'Let moderators know this review is inappropriate.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportReview(reviewId);
            setReportedIds((prev) => new Set(prev).add(reviewId));
          } catch (err) {
            Alert.alert(
              'Could not report review',
              err instanceof Error ? err.message : 'Please try again.',
            );
          }
        },
      },
    ]);
  };

  const header = (
    <View className="flex-row items-center px-4 pt-2">
      <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
        Teacher Profile
      </Text>
    </View>
  );

  if (loading) {
    return (
      <Screen>
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (error || !teacher) {
    return (
      <Screen>
        {header}
        <StateMessage
          icon="alert-circle-outline"
          title="Couldn't load this teacher"
          subtitle={error ?? 'This teacher may no longer exist.'}
          onRetry={load}
        />
      </Screen>
    );
  }

  const initials = teacher.name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');

  return (
    <Screen>
      {header}

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mt-4 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-accent/15">
            <Text className="text-2xl font-bold text-accent">{initials}</Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-foreground dark:text-foreground-dark">
            {teacher.name}
          </Text>
          <View className="mt-2 rounded-md bg-accent/10 px-2 py-1">
            <Text className="text-xs font-semibold text-accent">
              {verificationLabel(teacher.verificationStatus)}
            </Text>
          </View>
          {teacher.department && (
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
              {teacher.department}
            </Text>
          )}
          {teacher.courses.length > 0 && (
            <Text className="mt-2 text-center text-sm text-muted dark:text-muted-dark">
              {teacher.courses.map(formatCourse).join(', ')}
            </Text>
          )}
          <View className="mt-3 flex-row items-center rounded-xl bg-accent/10 px-4 py-2">
            <Ionicons name="star" size={18} color="#6366F1" />
            <Text className="ml-2 text-lg font-bold text-accent">
              {teacher.rating !== null ? teacher.rating.toFixed(1) : '—'}
            </Text>
            <Text className="ml-2 text-sm text-muted dark:text-muted-dark">
              {teacher.reviewCount} {teacher.reviewCount === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        </View>

        {teacher.breakdown && (
          <Card className="mt-6">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Rating breakdown
            </Text>
            <RatingBar label="Teaching" value={teacher.breakdown.teaching} />
            <RatingBar label="Grading" value={teacher.breakdown.grading} />
            <RatingBar label="Attendance" value={teacher.breakdown.attendance} />
          </Card>
        )}

        <View className="mt-4 flex-row gap-3">
          <Button
            label="Write a Review"
            onPress={() =>
              router.push({
                pathname: '/teachers/[id]/add-review',
                params: { id: teacher.id, name: teacher.name },
              })
            }
            className="flex-1"
          />
          <Button
            label="Ask a Question"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/faq',
                params: { askTeacherId: teacher.id, askTeacherName: teacher.name, openAsk: '1' },
              })
            }
            className="flex-1"
          />
        </View>

        <Text className="mb-3 mt-6 text-base font-semibold text-foreground dark:text-foreground-dark">
          Reviews
        </Text>
        {teacher.myPendingReviews.map((review) => (
          <Card key={review.id} className="mb-3 border border-amber-500/40 bg-amber-500/5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center self-start rounded-md bg-amber-500/15 px-2 py-0.5">
                <Ionicons name="time-outline" size={12} color="#D97706" />
                <Text className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Pending approval
                </Text>
              </View>
              <Text className="text-xs text-muted dark:text-muted-dark">{review.createdAt}</Text>
            </View>
            <View className="mt-2 flex-row items-center">
              <Ionicons name="star" size={13} color="#6366F1" />
              <Text className="ml-1 text-sm font-medium text-accent">
                {((review.teaching + review.grading + review.attendance) / 3).toFixed(1)}
              </Text>
            </View>
            {review.comment && (
              <Text className="mt-2 text-sm leading-5 text-muted dark:text-muted-dark">
                {review.comment}
              </Text>
            )}
            <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
              Only visible to you until a moderator approves it.
            </Text>
          </Card>
        ))}
        {teacher.reviews.length === 0 ? (
          <Text className="text-sm text-muted dark:text-muted-dark">
            {teacher.myPendingReviews.length > 0
              ? 'No approved reviews yet.'
              : 'No reviews yet — be the first to write one.'}
          </Text>
        ) : (
          teacher.reviews.map((review, index) => {
            const isReported = reportedIds.has(review.id);
            return (
              <AnimatedListItem key={review.id} index={index}>
                <Card className="mb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                      {review.author}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="mr-2 text-xs text-muted dark:text-muted-dark">
                        {review.createdAt}
                      </Text>
                      <Pressable
                        onPress={() => !isReported && handleReport(review.id)}
                        hitSlop={8}
                        disabled={isReported}
                      >
                        <Ionicons
                          name={isReported ? 'flag' : 'flag-outline'}
                          size={14}
                          color={isReported ? colors.accent : colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="star" size={13} color="#6366F1" />
                    <Text className="ml-1 text-sm font-medium text-accent">
                      {((review.teaching + review.grading + review.attendance) / 3).toFixed(1)}
                    </Text>
                  </View>
                  {review.course && (
                    <View className="mt-2 self-start rounded-md bg-accent/10 px-2 py-1">
                      <Text className="text-xs font-medium text-accent">
                        {formatCourse(review.course)}
                      </Text>
                    </View>
                  )}
                  {review.comment && (
                    <Text className="mt-2 text-sm leading-5 text-muted dark:text-muted-dark">
                      {review.comment}
                    </Text>
                  )}
                </Card>
              </AnimatedListItem>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
