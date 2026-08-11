import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Button, CardSkeletonList, Screen, StateMessage } from '@/components';
import { fetchQuestions } from '@/features/questions/api';
import type { QuestionListItem } from '@/features/questions/data';
import { QuestionCard } from '@/features/questions/QuestionCard';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

/** Papers have no comment section, so this is the "discussion" for a single
 *  paper — every question already linked to it (paper_id), plus a shortcut
 *  to ask a new one. Reached from the paper card's question-count chip. */
export default function PaperQuestionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setQuestions(await fetchQuestions(useAuthStore.getState().user?.id, { paperId: id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const askAboutPaper = () =>
    router.push({
      pathname: '/(tabs)/faq',
      params: { askPaperId: id, askPaperName: title ?? 'this paper', openAsk: '1' },
    });

  return (
    <Screen>
      <View className="flex-row items-center px-4 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
            Questions about this paper
          </Text>
          {title && (
            <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
              {title}
            </Text>
          )}
        </View>
      </View>

      <View className="px-4 py-3">
        <Button label="Ask a question about this paper" onPress={askAboutPaper} />
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage icon="alert-circle-outline" title="Couldn't load questions" subtitle={error} onRetry={load} />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <QuestionCard question={item} onPress={() => router.push(`/questions/${item.id}`)} />
          )}
          ListEmptyComponent={
            <StateMessage
              icon="chatbubble-ellipses-outline"
              title="No questions yet"
              subtitle="Be the first to ask something about this paper."
            />
          }
        />
      )}
    </Screen>
  );
}
