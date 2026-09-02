import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {
  AnimatedListItem,
  Button,
  CardSkeletonList,
  Chip,
  Screen,
  SearchBar,
  StateMessage,
} from '@/components';
import { fetchCourses } from '@/features/courses/api';
import { formatCourse } from '@/features/courses/types';
import type { Course } from '@/features/courses/types';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { fetchTeachers, suggestTeacher } from '@/features/teachers/api';
import {
  MAX_COMPARE_TEACHERS,
  MIN_COMPARE_TEACHERS,
  MIN_REVIEWS_FOR_QUALITY_TAG,
  TEACHER_QUALITY_TAGS,
  TEACHER_QUALITY_THRESHOLD,
  type TeacherListItem,
  type TeacherQualityKey,
} from '@/features/teachers/data';
import { TeacherCard } from '@/features/teachers/TeacherCard';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

const ALL_DEPARTMENTS: Department = { id: 'all', name: 'All' };
const ALL_COURSES: Course = {
  id: 'all',
  code: null,
  name: 'All courses',
  departmentId: null,
  department: null,
};

type SortOption = 'rating' | 'name' | 'department';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'name', label: 'Name' },
  { value: 'department', label: 'Department' },
];

function sortTeachers(teachers: TeacherListItem[], sortBy: SortOption): TeacherListItem[] {
  const sorted = [...teachers];
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'department':
      return sorted.sort((a, b) => (a.department ?? '').localeCompare(b.department ?? ''));
  }
}

function normalizeSearchValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(dr|mr|ms|mrs|prof)\.?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function matchesSearch(text: string | null | undefined, query: string): boolean {
  const normalized = normalizeSearchValue(text ?? '');
  if (!normalized) return false;
  return normalized.includes(query) || query.split(' ').every((part) => normalized.includes(part));
}

export default function TeachersScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>(ALL_DEPARTMENTS);
  const [selectedCourse, setSelectedCourse] = useState<Course>(ALL_COURSES);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [qualityFilters, setQualityFilters] = useState<Set<TeacherQualityKey>>(new Set());

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const [suggestVisible, setSuggestVisible] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestDeptId, setSuggestDeptId] = useState<string | null>(null);
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);

  const load = useCallback(async (departmentId: string, courseId: string, isRefresh = false) => {
    const shouldShowSkeleton = !isRefresh && !hasLoaded.current;
    shouldShowSkeleton ? setLoading(true) : setRefreshing(true);
    setError(null);
    try {
      const deptId = departmentId === 'all' ? undefined : departmentId;
      const selectedCourseId = courseId === 'all' ? undefined : courseId;
      const [depts, courseList, teacherList] = await Promise.all([
        fetchDepartments(),
        fetchCourses(deptId),
        fetchTeachers(deptId, selectedCourseId),
      ]);
      setDepartments(depts);
      setCourses(courseList);
      setTeachers(teacherList);
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      shouldShowSkeleton ? setLoading(false) : setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(selectedDept.id, selectedCourse.id, hasLoaded.current);
    }, [load, selectedDept.id, selectedCourse.id]),
  );

  const filtered = useMemo(() => {
    const search = normalizeSearchValue(query);
    const matches = teachers.filter((t) => {
      if (search) {
        const matchesText =
          matchesSearch(t.name, search) ||
          matchesSearch(t.department, search) ||
          t.courses.some(
            (course) =>
              matchesSearch(course.name, search) ||
              matchesSearch(course.code, search) ||
              matchesSearch(formatCourse(course), search),
          );
        if (!matchesText) return false;
      }
      if (qualityFilters.size > 0) {
        if (!t.breakdown || t.reviewCount < MIN_REVIEWS_FOR_QUALITY_TAG) return false;
        for (const key of qualityFilters) {
          if (t.breakdown[key] < TEACHER_QUALITY_THRESHOLD) return false;
        }
      }
      return true;
    });
    return sortTeachers(matches, sortBy);
  }, [teachers, query, sortBy, qualityFilters]);

  const toggleQualityFilter = (key: TeacherQualityKey) => {
    setQualityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareIds([]);
  };

  const toggleCompareSelection = (teacherId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(teacherId)) return prev.filter((id) => id !== teacherId);
      if (prev.length >= MAX_COMPARE_TEACHERS) {
        Alert.alert(
          'Compare up to 4 teachers',
          `You've already picked ${MAX_COMPARE_TEACHERS}. Remove one to add another.`,
        );
        return prev;
      }
      return [...prev, teacherId];
    });
  };

  const handleStartCompare = () => {
    if (compareIds.length < MIN_COMPARE_TEACHERS) return;
    router.push(`/teachers/compare?ids=${compareIds.join(',')}`);
  };

  const chips = [ALL_DEPARTMENTS, ...departments];
  const courseChips = [ALL_COURSES, ...courses];

  const closeSuggestModal = () => {
    setSuggestVisible(false);
    setSuggestName('');
    setSuggestDeptId(null);
  };

  const handleSuggestSubmit = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      setSuggestVisible(false);
      Alert.alert('Please log in', 'You need to be logged in to suggest a teacher.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
      return;
    }
    if (!suggestName.trim() || !suggestDeptId) return;

    setSuggestSubmitting(true);
    try {
      await suggestTeacher({
        userId: currentUser.id,
        name: suggestName.trim(),
        departmentId: suggestDeptId,
      });
      closeSuggestModal();
      Alert.alert('Thanks!', 'Your suggestion has been sent for review.');
    } catch (error) {
      Alert.alert(
        'Could not submit suggestion',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSuggestSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
            Teachers
          </Text>
          <Pressable
            onPress={() => (compareMode ? exitCompareMode() : setCompareMode(true))}
            hitSlop={8}
            className={
              compareMode
                ? 'flex-row items-center rounded-full bg-accent px-3 py-1.5'
                : 'flex-row items-center rounded-full border border-line px-3 py-1.5 dark:border-line-dark'
            }
          >
            <Ionicons
              name={compareMode ? 'close' : 'git-compare-outline'}
              size={16}
              color={compareMode ? '#FFFFFF' : colors.text}
            />
            <Text
              className={
                compareMode
                  ? 'ml-1.5 text-sm font-medium text-white'
                  : 'ml-1.5 text-sm font-medium text-foreground dark:text-foreground-dark'
              }
            >
              {compareMode ? 'Cancel' : 'Compare'}
            </Text>
          </Pressable>
        </View>
        <View className="mt-3">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search teacher or course..."
          />
        </View>
      </View>

      {compareMode && (
        <View className="mt-2 px-4">
          <Text className="text-xs text-muted dark:text-muted-dark">
            Pick {MIN_COMPARE_TEACHERS}-{MAX_COMPARE_TEACHERS} teachers to compare side by side.
          </Text>
        </View>
      )}

      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {chips.map((d) => (
            <Chip
              key={d.id}
              label={d.name}
              selected={selectedDept.id === d.id}
              onPress={() => {
                setSelectedDept(d);
                setSelectedCourse(ALL_COURSES);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View className="mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {courseChips.map((course) => (
            <Chip
              key={course.id}
              label={course.id === 'all' ? course.name : formatCourse(course)}
              selected={selectedCourse.id === course.id}
              onPress={() => setSelectedCourse(course)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="mt-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {TEACHER_QUALITY_TAGS.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              selected={qualityFilters.has(filter.key)}
              onPress={() => toggleQualityFilter(filter.key)}
            />
          ))}
          {qualityFilters.size > 0 && (
            <Chip label="Clear" selected={false} onPress={() => setQualityFilters(new Set())} />
          )}
        </ScrollView>
      </View>

      <View className="mt-2 flex-row items-center">
        <Text className="ml-4 mr-2 text-xs text-muted dark:text-muted-dark">Sort by</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {SORT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={sortBy === opt.value}
              onPress={() => setSortBy(opt.value)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load teachers"
          subtitle={error}
          onRetry={() => load(selectedDept.id, selectedCourse.id)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16, paddingBottom: compareMode ? 96 : 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={refreshing}
          onRefresh={() => load(selectedDept.id, selectedCourse.id, true)}
          ItemSeparatorComponent={() => <View className="mb-3 h-px bg-line dark:bg-line-dark" />}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <TeacherCard
                teacher={item}
                onPress={
                  compareMode
                    ? () => toggleCompareSelection(item.id)
                    : () => router.push(`/teachers/${item.id}`)
                }
                selectable={compareMode}
                selected={compareIds.includes(item.id)}
              />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <StateMessage
              icon="people-outline"
              title="No teachers found"
              subtitle={
                query || qualityFilters.size > 0
                  ? 'Try a different teacher, course, department, or quality filter.'
                  : 'No teachers have been added for this filter yet.'
              }
            />
          }
        />
      )}

      {!compareMode && (
        <Pressable
          onPress={() => setSuggestVisible(true)}
          hitSlop={8}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-accent"
          style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      {compareMode && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between border-t border-line bg-background px-4 py-3 dark:border-line-dark dark:bg-background-dark"
          style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } }}
        >
          <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
            {compareIds.length} of {MAX_COMPARE_TEACHERS} selected
          </Text>
          <Button
            label={`Compare${compareIds.length >= MIN_COMPARE_TEACHERS ? ` (${compareIds.length})` : ''}`}
            onPress={handleStartCompare}
            disabled={compareIds.length < MIN_COMPARE_TEACHERS}
            className="px-5"
          />
        </View>
      )}

      <Modal
        visible={suggestVisible}
        animationType="slide"
        transparent
        onRequestClose={closeSuggestModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="rounded-t-3xl bg-background px-4 pb-8 pt-6 dark:bg-background-dark">
              <Text className="mb-4 text-lg font-semibold text-foreground dark:text-foreground-dark">
                Suggest a Teacher
              </Text>
              <TextInput
                value={suggestName}
                onChangeText={setSuggestName}
                placeholder="Teacher name"
                placeholderTextColor={colors.textMuted}
                className="mb-3 h-12 rounded-xl border border-line bg-card px-3 text-base text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
              />
              <View className="mb-4 flex-row flex-wrap">
                {departments.map((d) => (
                  <Chip
                    key={d.id}
                    label={d.name}
                    selected={suggestDeptId === d.id}
                    onPress={() => setSuggestDeptId(d.id)}
                  />
                ))}
              </View>
              <Button
                label="Submit Suggestion"
                onPress={handleSuggestSubmit}
                disabled={!suggestName.trim() || !suggestDeptId}
                loading={suggestSubmitting}
              />
              <Button label="Cancel" variant="ghost" onPress={closeSuggestModal} className="mt-3" />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
