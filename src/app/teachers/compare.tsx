import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Card, Screen, StateMessage } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { fetchTeachersForCompare } from '@/features/teachers/api';
import {
  breakdownMetricValue,
  buildWinnerReasons,
  compareColorAt,
  computeMetricWinnerId,
  computeOverallWinnerId,
  summarizeForCompare,
} from '@/features/teachers/compare';
import {
  MIN_COMPARE_TEACHERS,
  reviewOverall,
  reviewSentiment,
  TEACHER_QUALITY_TAGS,
  type TeacherDetail,
  type TeacherReview,
} from '@/features/teachers/data';
import { useThemeColors } from '@/store/themeStore';

const SENTIMENT_BORDER_COLOR = { positive: '#10B981', neutral: '#A1A1AA', negative: '#EF4444' } as const;

/** One review, in full — no truncation and no algorithmic curation, so a
 *  student comparing teachers can read every comment themselves instead of
 *  trusting a "top pick". The left border color echoes the same sentiment
 *  bucket as the pill counts above it. */
function ReviewRow({ review }: { review: TeacherReview }) {
  const sentiment = reviewSentiment(reviewOverall(review));
  return (
    <View
      style={{ borderLeftWidth: 3, borderLeftColor: SENTIMENT_BORDER_COLOR[sentiment] }}
      className="mb-2 rounded-r-lg bg-background py-1.5 pl-2.5 pr-2 dark:bg-background-dark"
    >
      <View className="flex-row items-center justify-between">
        <Text
          numberOfLines={1}
          className="mr-2 flex-1 text-xs font-semibold text-foreground dark:text-foreground-dark"
        >
          {review.author}
        </Text>
        <View className="flex-row items-center">
          <Ionicons name="star" size={11} color="#6366F1" />
          <Text className="ml-1 text-xs font-medium text-accent">{reviewOverall(review).toFixed(1)}</Text>
        </View>
      </View>
      <View className="mt-0.5 flex-row items-center">
        {review.course && (
          <Text numberOfLines={1} className="mr-2 text-[10px] text-muted dark:text-muted-dark">
            {formatCourse(review.course)}
          </Text>
        )}
        <Text className="text-[10px] text-muted dark:text-muted-dark">{review.createdAt}</Text>
      </View>
      {review.comment && (
        <Text className="mt-1 text-xs leading-4 text-muted dark:text-muted-dark">{review.comment}</Text>
      )}
    </View>
  );
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('');
}

/** One horizontal bar for a single teacher, reused by both the "Overall
 *  rating" section and each metric row in "Rating breakdown". */
function TeacherBarRow({
  name,
  color,
  value,
  trophy,
}: {
  name: string;
  color: string;
  value: number | null;
  trophy?: boolean;
}) {
  const pct = value !== null ? Math.max(4, Math.min(100, (value / 5) * 100)) : 0;
  return (
    <View className="mb-2.5 flex-row items-center">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text
        numberOfLines={1}
        className="ml-2 w-24 text-xs text-muted dark:text-muted-dark"
      >
        {name}
      </Text>
      <View className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        {value !== null && (
          <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        )}
      </View>
      {trophy && <Ionicons name="trophy" size={12} color="#F59E0B" style={{ marginRight: 4 }} />}
      <Text className="w-9 text-right text-xs font-semibold text-foreground dark:text-foreground-dark">
        {value !== null ? value.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

const SENTIMENT_PILL_STYLES = {
  positive: { container: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  neutral: { container: 'bg-line dark:bg-line-dark', text: 'text-muted dark:text-muted-dark' },
  negative: { container: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400' },
} as const;

function SentimentPill({ label, tone }: { label: string; tone: keyof typeof SENTIMENT_PILL_STYLES }) {
  const s = SENTIMENT_PILL_STYLES[tone];
  return (
    <View className={`mb-1.5 mr-1.5 rounded-full px-2 py-0.5 ${s.container}`}>
      <Text className={`text-[10px] font-semibold ${s.text}`}>{label}</Text>
    </View>
  );
}

export default function CompareTeachersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const teacherIds = (ids ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const [teachers, setTeachers] = useState<TeacherDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    if (teacherIds.length < MIN_COMPARE_TEACHERS) return;
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      setTeachers(await fetchTeachersForCompare(teacherIds));
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
    // teacherIds is derived fresh from the route param string every render;
    // its joined value is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const header = (
    <View className="flex-row items-center px-4 pt-2">
      <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
        Compare Teachers
      </Text>
    </View>
  );

  if (teacherIds.length < MIN_COMPARE_TEACHERS) {
    return (
      <Screen>
        {header}
        <StateMessage
          icon="git-compare-outline"
          title="Nothing to compare"
          subtitle={`Go back and select at least ${MIN_COMPARE_TEACHERS} teachers.`}
        />
      </Screen>
    );
  }

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

  if (error || teachers.length === 0) {
    return (
      <Screen>
        {header}
        <StateMessage
          icon="alert-circle-outline"
          title="Couldn't load these teachers"
          subtitle={error ?? 'One of them may no longer exist.'}
          onRetry={load}
        />
      </Screen>
    );
  }

  const winnerId = computeOverallWinnerId(teachers);
  const winner = winnerId ? teachers.find((t) => t.id === winnerId) ?? null : null;
  const winnerReasons = winner
    ? buildWinnerReasons(
        winner,
        teachers.filter((t) => t.id !== winnerId),
      )
    : [];

  return (
    <Screen>
      {header}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
        >
          {teachers.map((t, i) => (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/teachers/${t.id}`)}
              className="mr-3 w-36 rounded-2xl border border-line bg-card p-3 dark:border-line-dark dark:bg-card-dark active:opacity-80"
            >
              <View className="flex-row items-center">
                <View
                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: compareColorAt(i) }}
                />
                <View className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-accent/15">
                  <Text className="text-xs font-semibold text-accent">{initialsOf(t.name)}</Text>
                </View>
              </View>
              <Text
                numberOfLines={2}
                className="mt-2 text-sm font-semibold text-foreground dark:text-foreground-dark"
              >
                {t.name}
              </Text>
              {t.department && (
                <Text numberOfLines={1} className="mt-0.5 text-[11px] text-muted dark:text-muted-dark">
                  {t.department}
                </Text>
              )}
              <View className="mt-2 flex-row items-center">
                <Ionicons name="star" size={11} color="#6366F1" />
                <Text className="ml-1 text-xs font-medium text-accent">
                  {t.rating !== null ? t.rating.toFixed(1) : '—'}
                </Text>
                <Text className="ml-1 text-[10px] text-muted dark:text-muted-dark">
                  ({t.reviewCount})
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View className="px-4">
          <Card className="mt-4 border-accent/30 bg-accent/5">
            {winner ? (
              <>
                <View className="flex-row items-center">
                  <Ionicons name="trophy" size={18} color="#F59E0B" />
                  <Text className="ml-2 flex-1 text-base font-semibold text-foreground dark:text-foreground-dark">
                    Our pick: {winner.name}
                  </Text>
                </View>
                <Text className="mt-1.5 text-xs leading-4 text-muted dark:text-muted-dark">
                  {winnerReasons.length > 0
                    ? winnerReasons.join(' · ')
                    : `Highest overall rating — ${winner.rating!.toFixed(1)}★ from ${winner.reviewCount} ${winner.reviewCount === 1 ? 'review' : 'reviews'}.`}
                </Text>
              </>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                <Text className="ml-2 flex-1 text-sm text-muted dark:text-muted-dark">
                  Not enough reviews yet to call a clear winner — compare the details below.
                </Text>
              </View>
            )}
          </Card>

          <Card className="mt-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Overall rating
            </Text>
            {teachers.map((t, i) => (
              <TeacherBarRow key={t.id} name={t.name} color={compareColorAt(i)} value={t.rating} />
            ))}
          </Card>

          <Card className="mt-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Rating breakdown
            </Text>
            {TEACHER_QUALITY_TAGS.map((tag, tagIndex) => {
              const metricWinnerId = computeMetricWinnerId(teachers, tag.key);
              return (
                <View key={tag.key} className={tagIndex > 0 ? 'mt-4' : undefined}>
                  <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">
                    {tag.label}
                  </Text>
                  {teachers.map((t, i) => (
                    <TeacherBarRow
                      key={t.id}
                      name={t.name}
                      color={compareColorAt(i)}
                      value={breakdownMetricValue(t.breakdown, tag.key)}
                      trophy={t.id === metricWinnerId}
                    />
                  ))}
                </View>
              );
            })}
          </Card>

          <Text className="mb-3 mt-6 text-base font-semibold text-foreground dark:text-foreground-dark">
            What students are saying
          </Text>
          {teachers.map((t, i) => {
            const summary = summarizeForCompare(t);
            return (
              <Card key={t.id} className="mb-3">
                <View className="mb-2 flex-row items-center">
                  <View
                    style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: compareColorAt(i) }}
                  />
                  <Text
                    numberOfLines={1}
                    className="ml-2 flex-1 text-sm font-semibold text-foreground dark:text-foreground-dark"
                  >
                    {t.name}
                  </Text>
                </View>
                {t.reviewCount === 0 ? (
                  <Text className="text-xs text-muted dark:text-muted-dark">No reviews yet.</Text>
                ) : (
                  <>
                    <View className="flex-row flex-wrap">
                      {summary.positive > 0 && (
                        <SentimentPill
                          label={`${summary.positive} positive`}
                          tone="positive"
                        />
                      )}
                      {summary.neutral > 0 && (
                        <SentimentPill label={`${summary.neutral} neutral`} tone="neutral" />
                      )}
                      {summary.negative > 0 && (
                        <SentimentPill
                          label={`${summary.negative} negative`}
                          tone="negative"
                        />
                      )}
                    </View>
                    <View className="mt-2">
                      {t.reviews.map((review) => (
                        <ReviewRow key={review.id} review={review} />
                      ))}
                    </View>
                  </>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
