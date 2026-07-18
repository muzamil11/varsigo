import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen } from '@/components';
import { submitReview } from '@/features/teachers/api';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

function RatingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="mb-4">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
          {label}
        </Text>
        <Text className="text-sm font-semibold text-accent">{value}/5</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const MIN_COMMENT_LENGTH = 10;

export default function AddReviewScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  const [teaching, setTeaching] = useState(3);
  const [grading, setGrading] = useState(3);
  const [attendance, setAttendance] = useState(3);
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const trimmedLength = comment.trim().length;
  const isValid = trimmedLength >= MIN_COMMENT_LENGTH;
  const validationMessage =
    trimmedLength === 0
      ? 'A comment is required before you can submit.'
      : !isValid
        ? `Please write at least ${MIN_COMMENT_LENGTH} characters (${trimmedLength}/${MIN_COMMENT_LENGTH}).`
        : null;

  const handleSubmit = async () => {
    if (!id) return;
    const user = useAuthStore.getState().user;
    if (!user) {
      Alert.alert('Please log in', 'You need to be logged in to submit a review.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        teacherId: id,
        userId: user.id,
        teachingScore: teaching,
        gradingScore: grading,
        attendanceScore: attendance,
        comment: comment.trim(),
        isAnonymous: anonymous,
      });
      Alert.alert(
        'Review submitted',
        'Thanks! Your review is pending moderation and will appear once approved.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(
        'Could not submit review',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          {name ? `Review ${name}` : 'Write a Review'}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card className="mt-4">
          <Text className="mb-4 text-base font-semibold text-foreground dark:text-foreground-dark">
            Rate your experience
          </Text>
          <RatingSlider label="Teaching" value={teaching} onChange={setTeaching} />
          <RatingSlider label="Grading" value={grading} onChange={setGrading} />
          <RatingSlider label="Attendance" value={attendance} onChange={setAttendance} />
        </Card>

        <Card className="mt-4">
          <Text className="mb-2 text-base font-semibold text-foreground dark:text-foreground-dark">
            Your review
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share what future students should know…"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            className="h-32 rounded-xl border border-line bg-background p-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          {validationMessage && (
            <Text className="mt-2 text-xs text-red-600 dark:text-red-400">
              {validationMessage}
            </Text>
          )}
        </Card>

        <Card className="mt-4 flex-row items-center justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-base font-medium text-foreground dark:text-foreground-dark">
              Post anonymously
            </Text>
            <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
              Your name will never be shown with this review.
            </Text>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        </Card>

        <Button
          label="Submit Review"
          onPress={handleSubmit}
          disabled={!isValid}
          loading={submitting}
          className="mt-6"
        />
      </ScrollView>
    </Screen>
  );
}
