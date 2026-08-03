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
import type { TeacherListItem } from '@/features/teachers/data';
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

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

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
      if (!search) return true;
      return (
        matchesSearch(t.name, search) ||
        matchesSearch(t.department, search) ||
        t.courses.some(
          (course) =>
            matchesSearch(course.name, search) ||
            matchesSearch(course.code, search) ||
            matchesSearch(formatCourse(course), search),
        )
      );
    });
    return sortTeachers(matches, sortBy);
  }, [teachers, query, sortBy]);

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
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Teachers
        </Text>
        <View className="mt-3">
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search teacher or course..."
          />
        </View>
      </View>

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
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshing={refreshing}
          onRefresh={() => load(selectedDept.id, selectedCourse.id, true)}
          ItemSeparatorComponent={() => <View className="mb-3 h-px bg-line dark:bg-line-dark" />}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <TeacherCard teacher={item} onPress={() => router.push(`/teachers/${item.id}`)} />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <StateMessage
              icon="people-outline"
              title="No teachers found"
              subtitle={
                query
                  ? 'Try a different teacher, course, or department filter.'
                  : 'No teachers have been added for this filter yet.'
              }
            />
          }
        />
      )}

      <Pressable
        onPress={() => setSuggestVisible(true)}
        hitSlop={8}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-accent"
        style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

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
