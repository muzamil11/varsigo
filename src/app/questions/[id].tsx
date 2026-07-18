import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen, StateMessage } from '@/components';
import {
  fetchQuestionById,
  reportAnswer,
  reportQuestion,
  submitAnswer,
  toggleAnswerVote,
  toggleQuestionVote,
} from '@/features/questions/api';
import type { QuestionDetail } from '@/features/questions/data';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

const MIN_ANSWER_LENGTH = 8;

export default function QuestionDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setQuestion(await fetchQuestionById(id, useAuthStore.getState().user?.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitAnswer = async () => {
    const user = useAuthStore.getState().user;
    if (!user || !question) {
      Alert.alert('Please log in', 'You need to be logged in to answer.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (answer.trim().length < MIN_ANSWER_LENGTH) return;

    setSubmitting(true);
    try {
      await submitAnswer({
        questionId: question.id,
        userId: user.id,
        body: answer.trim(),
        isAnonymous: anonymous,
      });
      setAnswer('');
      await load();
    } catch (err) {
      Alert.alert('Could not post answer', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionHelpful = async () => {
    if (!question) return;
    const previous = question;
    setQuestion({
      ...question,
      votedByMe: !question.votedByMe,
      upvoteCount: Math.max(0, question.upvoteCount + (question.votedByMe ? -1 : 1)),
    });
    try {
      const result = await toggleQuestionVote(question.id);
      setQuestion((current) =>
        current ? { ...current, votedByMe: result.voted, upvoteCount: result.count } : current,
      );
    } catch {
      setQuestion(previous);
    }
  };

  const handleAnswerHelpful = async (answerId: string) => {
    if (!question) return;
    const previous = question;
    const answerItem = question.answers.find((item) => item.id === answerId);
    if (!answerItem) return;
    setQuestion({
      ...question,
      answers: question.answers.map((item) =>
        item.id === answerId
          ? {
              ...item,
              votedByMe: !item.votedByMe,
              upvoteCount: Math.max(0, item.upvoteCount + (item.votedByMe ? -1 : 1)),
            }
          : item,
      ),
    });
    try {
      const result = await toggleAnswerVote(answerId);
      setQuestion((current) =>
        current
          ? {
              ...current,
              answers: current.answers.map((item) =>
                item.id === answerId
                  ? { ...item, votedByMe: result.voted, upvoteCount: result.count }
                  : item,
              ),
            }
          : current,
      );
    } catch {
      setQuestion(previous);
    }
  };

  const handleReport = (kind: 'question' | 'answer', targetId: string) => {
    Alert.alert('Report this content?', 'Moderators will review it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            kind === 'question' ? await reportQuestion(targetId) : await reportAnswer(targetId);
            setQuestion((current) => {
              if (!current) return current;
              if (kind === 'question') return { ...current, reportedByMe: true };
              return {
                ...current,
                answers: current.answers.map((item) =>
                  item.id === targetId ? { ...item, reportedByMe: true } : item,
                ),
              };
            });
          } catch (err) {
            Alert.alert('Could not report', err instanceof Error ? err.message : 'Please try again.');
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
        Question
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

  if (error || !question) {
    return (
      <Screen>
        {header}
        <StateMessage
          icon="alert-circle-outline"
          title="Couldn't load this question"
          subtitle={error ?? 'This question may no longer exist.'}
          onRetry={load}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <Card className="mt-4">
          <View className="flex-row items-start justify-between">
            <Text className="mr-3 flex-1 text-xl font-bold text-foreground dark:text-foreground-dark">
              {question.title}
            </Text>
            <Pressable
              onPress={() => handleReport('question', question.id)}
              disabled={question.reportedByMe}
              hitSlop={8}
            >
              <Ionicons
                name={question.reportedByMe ? 'flag' : 'flag-outline'}
                size={17}
                color={question.reportedByMe ? colors.accent : colors.textMuted}
              />
            </Pressable>
          </View>
          {question.body && (
            <Text className="mt-3 text-sm leading-5 text-muted dark:text-muted-dark">
              {question.body}
            </Text>
          )}
          <Text className="mt-3 text-xs text-muted dark:text-muted-dark">
            {question.department ?? 'General'} - Asked by {question.author} - {question.createdAt}
          </Text>
          <View className="mt-4 flex-row">
            <Button
              label={`Helpful (${question.upvoteCount})`}
              variant={question.votedByMe ? 'primary' : 'ghost'}
              onPress={handleQuestionHelpful}
              className="h-10 px-3"
            />
          </View>
        </Card>

        <Text className="mb-3 mt-6 text-base font-semibold text-foreground dark:text-foreground-dark">
          Answers
        </Text>
        {question.answers.length === 0 ? (
          <Text className="text-sm text-muted dark:text-muted-dark">No answers yet.</Text>
        ) : (
          question.answers.map((item) => (
            <Card key={item.id} className="mb-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  {item.accepted && (
                    <Text className="mb-2 text-xs font-semibold text-accent">Accepted answer</Text>
                  )}
                  <Text className="text-sm leading-5 text-foreground dark:text-foreground-dark">
                    {item.body}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleReport('answer', item.id)}
                  disabled={item.reportedByMe}
                  hitSlop={8}
                  className="ml-2"
                >
                  <Ionicons
                    name={item.reportedByMe ? 'flag' : 'flag-outline'}
                    size={15}
                    color={item.reportedByMe ? colors.accent : colors.textMuted}
                  />
                </Pressable>
              </View>
              <Text className="mt-3 text-xs text-muted dark:text-muted-dark">
                {item.author} - {item.createdAt}
              </Text>
              <Button
                label={`Helpful (${item.upvoteCount})`}
                variant={item.votedByMe ? 'primary' : 'ghost'}
                onPress={() => handleAnswerHelpful(item.id)}
                className="mt-3 h-10 px-3"
              />
            </Card>
          ))
        )}

        <Card className="mt-4">
          <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Add an answer
          </Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Share a helpful answer..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            className="h-28 rounded-xl border border-line bg-background p-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          <View className="my-4 flex-row items-center justify-between">
            <Text className="text-sm text-foreground dark:text-foreground-dark">Answer anonymously</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Button
            label="Post Answer"
            onPress={handleSubmitAnswer}
            disabled={answer.trim().length < MIN_ANSWER_LENGTH}
            loading={submitting}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
