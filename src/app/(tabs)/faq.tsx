import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button, CardSkeletonList, Chip, Screen, SearchBar, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { FAQ_CATEGORIES, FAQS, type FaqCategory, type FaqItem } from '@/features/faq/data';
import { FaqAccordionItem } from '@/features/faq/FaqAccordionItem';
import { fetchQuestions, submitQuestion } from '@/features/questions/api';
import type { QuestionListItem } from '@/features/questions/data';
import { QuestionCard } from '@/features/questions/QuestionCard';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

type Segment = 'faq' | 'questions';

const CATEGORY_ORDER = FAQ_CATEGORIES.filter((c): c is FaqCategory => c !== 'All');
const MIN_QUESTION_TITLE = 12;

export default function HelpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    askTeacherId?: string;
    askTeacherName?: string;
    askPaperId?: string;
    askPaperName?: string;
    openAsk?: string;
  }>();
  const [segment, setSegment] = useState<Segment>('questions');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | FaqCategory>('All');
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const hasLoadedQuestions = useRef(false);

  const [askVisible, setAskVisible] = useState(false);
  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [askDepartmentId, setAskDepartmentId] = useState<string | null>(null);
  const [askAnonymous, setAskAnonymous] = useState(true);
  const [askTeacherId, setAskTeacherId] = useState<string | null>(null);
  const [askTeacherName, setAskTeacherName] = useState<string | null>(null);
  const [askPaperId, setAskPaperId] = useState<string | null>(null);
  const [askPaperName, setAskPaperName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const consumedAskParams = useRef(false);

  // Arriving from a teacher's review page or a paper card's "Ask a
  // Question" button — open straight into the ask form with that
  // teacher/paper pre-linked. Guarded by a ref so it only fires once per
  // navigation, not every time this (persistently mounted) tab screen
  // regains focus.
  useEffect(() => {
    if (params.openAsk !== '1' || consumedAskParams.current) return;
    consumedAskParams.current = true;
    setSegment('questions');
    setAskTeacherId(params.askTeacherId ?? null);
    setAskTeacherName(params.askTeacherName ?? null);
    setAskPaperId(params.askPaperId ?? null);
    setAskPaperName(params.askPaperName ?? null);
    setAskVisible(true);
  }, [params.openAsk, params.askTeacherId, params.askTeacherName, params.askPaperId, params.askPaperName]);

  const loadQuestions = useCallback(async (isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoadedQuestions.current;
    shouldShowSkeleton ? setLoadingQuestions(true) : setRefreshing(true);
    setQuestionError(null);
    try {
      const [questionList, departmentList] = await Promise.all([
        fetchQuestions(useAuthStore.getState().user?.id),
        fetchDepartments(),
      ]);
      setQuestions(questionList);
      setDepartments(departmentList);
      hasLoadedQuestions.current = true;
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      shouldShowSkeleton ? setLoadingQuestions(false) : setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuestions(hasLoadedQuestions.current);
    }, [loadQuestions]),
  );

  const faqSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (f: FaqItem) =>
      (category === 'All' || f.category === category) &&
      (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));

    return CATEGORY_ORDER.map((cat) => ({
      title: cat,
      data: FAQS.filter((f) => f.category === cat && matches(f)),
    })).filter((section) => section.data.length > 0);
  }, [query, category]);

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.body?.toLowerCase().includes(q) ?? false) ||
        (item.department?.toLowerCase().includes(q) ?? false),
    );
  }, [questions, query]);

  const closeAsk = () => {
    setAskVisible(false);
    setAskTitle('');
    setAskBody('');
    setAskDepartmentId(null);
    setAskAnonymous(true);
    setAskTeacherId(null);
    setAskTeacherName(null);
    setAskPaperId(null);
    setAskPaperName(null);
  };

  const handleSubmitQuestion = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      setAskVisible(false);
      Alert.alert('Please log in', 'You need to be logged in to ask a question.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (askTitle.trim().length < MIN_QUESTION_TITLE) return;

    setSubmitting(true);
    try {
      await submitQuestion({
        userId: user.id,
        title: askTitle.trim(),
        body: askBody.trim(),
        departmentId: askDepartmentId,
        isAnonymous: askAnonymous,
        teacherId: askTeacherId,
        paperId: askPaperId,
      });
      closeAsk();
      await loadQuestions(true);
    } catch (error) {
      Alert.alert('Could not post question', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Help</Text>
          {segment === 'questions' && (
            <Pressable
              onPress={() => setAskVisible(true)}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-accent"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
        <View className="mt-3">
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search help..." />
        </View>
      </View>

      <View className="mt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <Chip label="Questions" selected={segment === 'questions'} onPress={() => setSegment('questions')} />
          <Chip label="FAQ" selected={segment === 'faq'} onPress={() => setSegment('faq')} />
        </ScrollView>
      </View>

      {segment === 'faq' ? (
        <>
          <View className="mt-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {FAQ_CATEGORIES.map((c) => (
                <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
              ))}
            </ScrollView>
          </View>
          <FlatList
            data={faqSections.flatMap((section) => [
              { kind: 'header' as const, id: section.title, title: section.title },
              ...section.data.map((item) => ({ kind: 'item' as const, id: item.id, item })),
            ])}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            renderItem={({ item }) =>
              item.kind === 'header' ? (
                <Text className="mb-3 mt-2 text-sm font-semibold uppercase text-muted dark:text-muted-dark">
                  {item.title}
                </Text>
              ) : (
                <FaqAccordionItem item={item.item} />
              )
            }
            ListEmptyComponent={<StateMessage icon="help-circle-outline" title="No FAQ matches" />}
          />
        </>
      ) : loadingQuestions ? (
        <CardSkeletonList />
      ) : questionError ? (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load questions"
          subtitle={questionError}
          onRetry={() => loadQuestions()}
        />
      ) : (
        <FlatList
          data={filteredQuestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => loadQuestions(true)}
          renderItem={({ item }) => (
            <QuestionCard question={item} onPress={() => router.push(`/questions/${item.id}`)} />
          )}
          ListEmptyComponent={
            <StateMessage
              icon="chatbubble-ellipses-outline"
              title="No questions yet"
              subtitle="Ask what future students need to know."
            />
          }
        />
      )}

      <Modal visible={askVisible} animationType="slide" transparent onRequestClose={closeAsk}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
          <View className="rounded-t-3xl bg-background px-4 pb-8 pt-6 dark:bg-background-dark">
            <Text className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
              Ask a Question
            </Text>
            {(askTeacherName || askPaperName) && (
              <View className="mb-3 flex-row items-center justify-between rounded-xl bg-accent/10 px-3 py-2">
                <Text className="flex-1 text-sm font-medium text-accent">
                  About: {askTeacherName ?? askPaperName}
                </Text>
                <Pressable
                  onPress={() => {
                    setAskTeacherId(null);
                    setAskTeacherName(null);
                    setAskPaperId(null);
                    setAskPaperName(null);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={colors.accent} />
                </Pressable>
              </View>
            )}
            <TextInput
              value={askTitle}
              onChangeText={setAskTitle}
              placeholder="What do you want to ask?"
              placeholderTextColor={colors.textMuted}
              className="mb-3 h-12 rounded-xl border border-line bg-card px-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
            />
            <TextInput
              value={askBody}
              onChangeText={setAskBody}
              placeholder="Add details (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="mb-3 h-28 rounded-xl border border-line bg-card p-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
            />
            {departments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                <Chip label="General" selected={askDepartmentId === null} onPress={() => setAskDepartmentId(null)} />
                {departments.map((department) => (
                  <Chip
                    key={department.id}
                    label={department.name}
                    selected={askDepartmentId === department.id}
                    onPress={() => setAskDepartmentId(department.id)}
                  />
                ))}
              </ScrollView>
            )}
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm text-foreground dark:text-foreground-dark">Post anonymously</Text>
              <Switch
                value={askAnonymous}
                onValueChange={setAskAnonymous}
                trackColor={{ true: colors.accent, false: colors.border }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Button
              label="Post Question"
              onPress={handleSubmitQuestion}
              disabled={askTitle.trim().length < MIN_QUESTION_TITLE}
              loading={submitting}
            />
            <Button label="Cancel" variant="ghost" onPress={closeAsk} className="mt-3" />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
