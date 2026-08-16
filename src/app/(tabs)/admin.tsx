import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, ScrollView, Text, View } from 'react-native';

import {
  AnimatedListItem,
  Button,
  Card,
  CardSkeletonList,
  Chip,
  Screen,
  StateMessage,
} from '@/components';
import { AdminReviewCard } from '@/features/admin/AdminReviewCard';
import { AdminCommunityCard } from '@/features/admin/AdminCommunityCard';
import {
  addCourse,
  addDepartment,
  addTeacher,
  assignTeacherCourse,
  approveReview,
  approveTeacherSuggestion,
  approveUpload,
  deleteCourse,
  deleteDepartment,
  deleteTeacher,
  dismissCommunityReport,
  fetchAdminDepartments,
  fetchAdminCourses,
  fetchAdminStats,
  fetchAdminTeachers,
  fetchApprovedUploads,
  fetchPendingReviews,
  fetchPendingTeacherSuggestions,
  fetchPendingUploads,
  fetchReportedCommunity,
  hideCommunityItem,
  rejectReview,
  rejectTeacherSuggestion,
  rejectUpload,
  updateUpload,
} from '@/features/admin/api';
import type { UpdateUploadInput } from '@/features/admin/api';
import { AdminTeachersPanel } from '@/features/admin/AdminTeachersPanel';
import type {
  AdminDepartment,
  AdminCourse,
  AdminCommunityReport,
  AdminReview,
  AdminStats,
  AdminTeacher,
  AdminUpload,
  TeacherSuggestion,
} from '@/features/admin/data';
import { AdminUploadCard } from '@/features/admin/AdminUploadCard';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import { AdminLinksPanel } from '@/features/links/AdminLinksPanel';
import { AdminSettingsPanel } from '@/features/settings/AdminSettingsPanel';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/store/themeStore';

type Segment = 'reviews' | 'uploads' | 'teachers' | 'community' | 'links' | 'settings';

async function loadAdminResource<T>(name: string, request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    throw new Error(`Could not load admin ${name}: ${message}`);
  }
}

function StatCard({
  label,
  value,
  accent = false,
  onPress,
}: {
  label: string;
  value?: number;
  accent?: boolean;
  onPress?: () => void;
}) {
  return (
    <Card className="min-w-[30%] flex-1 items-start" onPress={onPress}>
      <Text
        className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-foreground dark:text-foreground-dark'}`}
      >
        {value ?? '–'}
      </Text>
      <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{label}</Text>
    </Card>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const [segment, setSegment] = useState<Segment>('reviews');
  const [teacherStep, setTeacherStep] = useState<'departments' | 'courses' | 'teachers'>('departments');

  /** Stat cards up top jump straight to the relevant tab (and, for
   *  Teachers-related stats, the relevant step inside it) — so every number
   *  on screen is a shortcut, not just a static count. */
  const goTo = (target: Segment, step?: 'departments' | 'courses' | 'teachers') => {
    setSegment(target);
    if (step) setTeacherStep(step);
  };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [publishedUploads, setPublishedUploads] = useState<AdminUpload[]>([]);
  const [uploadsView, setUploadsView] = useState<'pending' | 'published'>('pending');
  const [adminDepartments, setAdminDepartments] = useState<AdminDepartment[]>([]);
  const [adminCourses, setAdminCourses] = useState<AdminCourse[]>([]);
  const [adminTeachers, setAdminTeachers] = useState<AdminTeacher[]>([]);
  const [teacherSuggestions, setTeacherSuggestions] = useState<TeacherSuggestion[]>([]);
  const [communityReports, setCommunityReports] = useState<AdminCommunityReport[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const segmentOpacity = useRef(new Animated.Value(1)).current;
  const hasLoaded = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
    if (!user) return;
    const shouldShowSkeleton = mode === 'initial' && !hasLoaded.current;
    const shouldShowSpinner = mode === 'refresh';
    if (shouldShowSkeleton) setLoading(true);
    if (shouldShowSpinner) setRefreshing(true);
    setError(null);
    setWarning(null);
    try {
      const results = await Promise.allSettled([
        loadAdminResource('stats', fetchAdminStats(user.email)),
        loadAdminResource('reviews', fetchPendingReviews(user.email)),
        loadAdminResource('uploads', fetchPendingUploads(user.email)),
        loadAdminResource('published uploads', fetchApprovedUploads(user.email)),
        loadAdminResource('departments', fetchAdminDepartments(user.email)),
        loadAdminResource('courses', fetchAdminCourses(user.email)),
        loadAdminResource('teachers', fetchAdminTeachers(user.email)),
        loadAdminResource('teacher suggestions', fetchPendingTeacherSuggestions(user.email)),
        loadAdminResource('community reports', fetchReportedCommunity(user.email)),
        loadAdminResource('department list', fetchDepartments()),
      ] as const);

      const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('[admin] partial load failed', failures.map((failure) => failure.reason));
        const messages = failures.map((failure) =>
          failure.reason instanceof Error ? failure.reason.message : 'Could not load admin data.',
        );
        if (!hasLoaded.current && failures.length === results.length) {
          throw new Error(messages[0] ?? 'Something went wrong.');
        }
        setWarning(messages.join('\n'));
      }

      const [
        statsResult,
        reviewsResult,
        uploadsResult,
        publishedUploadsResult,
        adminDepartmentsResult,
        coursesResult,
        teachersResult,
        suggestionsResult,
        communityResult,
        deptResult,
      ] = results;

      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (reviewsResult.status === 'fulfilled') setReviews(reviewsResult.value);
      if (uploadsResult.status === 'fulfilled') setUploads(uploadsResult.value);
      if (publishedUploadsResult.status === 'fulfilled') setPublishedUploads(publishedUploadsResult.value);
      if (adminDepartmentsResult.status === 'fulfilled') setAdminDepartments(adminDepartmentsResult.value);
      if (coursesResult.status === 'fulfilled') setAdminCourses(coursesResult.value);
      if (teachersResult.status === 'fulfilled') setAdminTeachers(teachersResult.value);
      if (suggestionsResult.status === 'fulfilled') setTeacherSuggestions(suggestionsResult.value);
      if (communityResult.status === 'fulfilled') setCommunityReports(communityResult.value);
      if (deptResult.status === 'fulfilled') setDepartments(deptResult.value);
      hasLoaded.current = true;
    } catch (err) {
      console.error('[admin] load failed', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      if (shouldShowSkeleton) setLoading(false);
      if (shouldShowSpinner) setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load(hasLoaded.current ? 'refresh' : 'initial');
    }, [isAdmin, load]),
  );

  // Crossfade the Reviews/Uploads panel whenever the segment changes.
  useEffect(() => {
    segmentOpacity.setValue(0);
    Animated.timing(segmentOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [segment, segmentOpacity]);

  // Someone reaching this route without the admin email (e.g. deep link, or
  // typing the path directly) — the tab itself is already hidden for them,
  // this is the belt-and-suspenders guard on the route.
  useEffect(() => {
    if (isAdmin) return;
    const t = setTimeout(() => router.replace('/(tabs)'), 1500);
    return () => clearTimeout(t);
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <Screen className="items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
        <Text className="mt-4 text-xl font-bold text-foreground dark:text-foreground-dark">
          Access Denied
        </Text>
        <Text className="mt-2 text-center text-base text-muted dark:text-muted-dark">
          This area is restricted to admins only. Redirecting you home…
        </Text>
        <Button label="Go to Home now" onPress={() => router.replace('/(tabs)')} className="mt-6" />
      </Screen>
    );
  }

  const handleApproveReview = async (review: AdminReview) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    try {
      await approveReview(user!.email, review.id);
      setStats((s) =>
        s ? { ...s, pendingReviews: s.pendingReviews - 1, approvedReviews: s.approvedReviews + 1 } : s,
      );
    } catch (err) {
      Alert.alert('Could not approve', err instanceof Error ? err.message : 'Please try again.');
      setReviews((prev) => [review, ...prev]);
    }
  };

  const handleRejectReview = async (review: AdminReview) => {
    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    try {
      await rejectReview(user!.email, review.id);
      setStats((s) => (s ? { ...s, pendingReviews: s.pendingReviews - 1 } : s));
    } catch (err) {
      Alert.alert('Could not reject', err instanceof Error ? err.message : 'Please try again.');
      setReviews((prev) => [review, ...prev]);
    }
  };

  const handleApproveUpload = async (upload: AdminUpload) => {
    setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    try {
      await approveUpload(user!.email, upload.id);
      setStats((s) =>
        s ? { ...s, pendingUploads: s.pendingUploads - 1, approvedUploads: s.approvedUploads + 1 } : s,
      );
      setPublishedUploads((prev) => [upload, ...prev]);
    } catch (err) {
      Alert.alert('Could not approve', err instanceof Error ? err.message : 'Please try again.');
      setUploads((prev) => [upload, ...prev]);
    }
  };

  const handleRejectUpload = async (upload: AdminUpload) => {
    setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    try {
      await rejectUpload(user!.email, upload.id);
      setStats((s) => (s ? { ...s, pendingUploads: s.pendingUploads - 1 } : s));
    } catch (err) {
      Alert.alert('Could not reject', err instanceof Error ? err.message : 'Please try again.');
      setUploads((prev) => [upload, ...prev]);
    }
  };

  const handleDeletePublishedUpload = (upload: AdminUpload) => {
    Alert.alert('Delete this paper?', 'It will be removed from the site immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setPublishedUploads((prev) => prev.filter((u) => u.id !== upload.id));
          try {
            await rejectUpload(user!.email, upload.id);
            setStats((s) => (s ? { ...s, approvedUploads: s.approvedUploads - 1 } : s));
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
            setPublishedUploads((prev) => [upload, ...prev]);
          }
        },
      },
    ]);
  };

  const handleUpdateUpload = async (
    upload: AdminUpload,
    input: UpdateUploadInput,
    scope: 'pending' | 'published',
  ) => {
    if (!user) return;
    await updateUpload(user.email, upload.id, input);
    const department = adminDepartments.find((d) => d.id === input.departmentId)?.name ?? null;
    const patch = { ...input, department };
    const setter = scope === 'pending' ? setUploads : setPublishedUploads;
    setter((prev) => prev.map((u) => (u.id === upload.id ? { ...u, ...patch } : u)));
  };

  const handleAddTeacher = async (name: string, departmentId: string, courseIds: string[]) => {
    if (!user) return;
    try {
      await addTeacher({ adminEmail: user.email, name, departmentId, courseIds });
      await load('silent');
    } catch (err) {
      Alert.alert('Could not add teacher', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleAddCourse = async (name: string, code: string, departmentId: string) => {
    if (!user) return;
    try {
      await addCourse({ adminEmail: user.email, name, code, departmentId });
      await load('silent');
    } catch (err) {
      Alert.alert('Could not add course', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleAssignTeacherCourse = async (teacherId: string, courseId: string) => {
    if (!user) return;
    try {
      await assignTeacherCourse(user.email, teacherId, courseId);
      await load('silent');
    } catch (err) {
      Alert.alert('Could not assign course', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleAddDepartment = async (name: string) => {
    if (!user) return;
    try {
      await addDepartment(user.email, name);
      await load('silent');
    } catch (err) {
      Alert.alert('Could not add department', err instanceof Error ? err.message : 'Please try again.');
      throw err;
    }
  };

  const handleDeleteDepartment = (department: AdminDepartment) => {
    Alert.alert(
      'Delete department?',
      `This removes ${department.name}. Existing teachers, uploads, and suggestions will keep working but lose this department link.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAdminDepartments((prev) => prev.filter((d) => d.id !== department.id));
            setDepartments((prev) => prev.filter((d) => d.id !== department.id));
            if (department.id === undefined) return;
            try {
              await deleteDepartment(user!.email, department.id);
              setStats((s) => (s ? { ...s, totalDepartments: s.totalDepartments - 1 } : s));
              await load('silent');
            } catch (err) {
              Alert.alert(
                'Could not delete department',
                err instanceof Error ? err.message : 'Please try again.',
              );
              setAdminDepartments((prev) => [department, ...prev]);
              setDepartments((prev) => [{ id: department.id, name: department.name }, ...prev]);
            }
          },
        },
      ],
    );
  };

  const handleDeleteCourse = (course: AdminCourse) => {
    Alert.alert(
      'Delete course?',
      `This removes ${course.code ? `${course.code} - ` : ''}${course.name}. Teacher reviews stay safe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAdminCourses((prev) => prev.filter((item) => item.id !== course.id));
            try {
              await deleteCourse(user!.email, course.id);
              setStats((s) => (s ? { ...s, totalCourses: s.totalCourses - 1 } : s));
              await load('silent');
            } catch (err) {
              Alert.alert(
                'Could not delete course',
                err instanceof Error ? err.message : 'Please try again.',
              );
              setAdminCourses((prev) => [course, ...prev]);
            }
          },
        },
      ],
    );
  };

  const handleDeleteTeacher = (teacher: AdminTeacher) => {
    Alert.alert(
      'Delete teacher?',
      `This permanently removes ${teacher.name} (and their reviews) and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAdminTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
            try {
              await deleteTeacher(user!.email, teacher.id);
              setStats((s) => (s ? { ...s, totalTeachers: s.totalTeachers - 1 } : s));
            } catch (err) {
              Alert.alert(
                'Could not delete teacher',
                err instanceof Error ? err.message : 'Please try again.',
              );
              setAdminTeachers((prev) => [teacher, ...prev]);
            }
          },
        },
      ],
    );
  };

  const handleApproveSuggestion = async (suggestion: TeacherSuggestion) => {
    setTeacherSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    try {
      await approveTeacherSuggestion(user!.email, suggestion);
      setStats((s) =>
        s
          ? {
              ...s,
              pendingTeacherSuggestions: s.pendingTeacherSuggestions - 1,
              totalTeachers: s.totalTeachers + 1,
            }
          : s,
      );
      load('silent');
    } catch (err) {
      Alert.alert('Could not approve', err instanceof Error ? err.message : 'Please try again.');
      setTeacherSuggestions((prev) => [suggestion, ...prev]);
    }
  };

  const handleRejectSuggestion = async (suggestion: TeacherSuggestion) => {
    setTeacherSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    try {
      await rejectTeacherSuggestion(user!.email, suggestion.id);
      setStats((s) => (s ? { ...s, pendingTeacherSuggestions: s.pendingTeacherSuggestions - 1 } : s));
    } catch (err) {
      Alert.alert('Could not reject', err instanceof Error ? err.message : 'Please try again.');
      setTeacherSuggestions((prev) => [suggestion, ...prev]);
    }
  };

  const handleDismissCommunityReport = async (report: AdminCommunityReport) => {
    setCommunityReports((prev) => prev.filter((item) => item.id !== report.id));
    try {
      await dismissCommunityReport(user!.email, report);
      setStats((s) =>
        s ? { ...s, pendingCommunityReports: Math.max(0, s.pendingCommunityReports - 1) } : s,
      );
    } catch (err) {
      Alert.alert('Could not dismiss', err instanceof Error ? err.message : 'Please try again.');
      setCommunityReports((prev) => [report, ...prev]);
    }
  };

  const handleHideCommunityItem = async (report: AdminCommunityReport) => {
    Alert.alert('Hide community item?', 'This removes it from public Q&A.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Hide',
        style: 'destructive',
        onPress: async () => {
          setCommunityReports((prev) => prev.filter((item) => item.id !== report.id));
          try {
            await hideCommunityItem(user!.email, report);
            setStats((s) =>
              s ? { ...s, pendingCommunityReports: Math.max(0, s.pendingCommunityReports - 1) } : s,
            );
          } catch (err) {
            Alert.alert('Could not hide', err instanceof Error ? err.message : 'Please try again.');
            setCommunityReports((prev) => [report, ...prev]);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View className="px-4 pt-2">
        <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Admin</Text>
      </View>

      <View className="mt-4 px-4">
        <View className="flex-row flex-wrap gap-2">
          <StatCard
            label="Departments"
            value={stats?.totalDepartments}
            onPress={() => goTo('teachers', 'departments')}
          />
          <StatCard
            label="Teachers"
            value={stats?.totalTeachers}
            onPress={() => goTo('teachers', 'teachers')}
          />
          <StatCard
            label="Courses"
            value={stats?.totalCourses}
            onPress={() => goTo('teachers', 'courses')}
          />
          <StatCard
            label="Reviews approved"
            value={stats?.approvedReviews}
            onPress={() => goTo('reviews')}
          />
          <StatCard
            label="Uploads approved"
            value={stats?.approvedUploads}
            onPress={() => goTo('uploads')}
          />
          <StatCard
            label="Pending reviews"
            value={stats?.pendingReviews}
            accent
            onPress={() => goTo('reviews')}
          />
          <StatCard
            label="Pending uploads"
            value={stats?.pendingUploads}
            accent
            onPress={() => goTo('uploads')}
          />
          <StatCard
            label="Pending suggestions"
            value={stats?.pendingTeacherSuggestions}
            accent
            onPress={() => goTo('teachers', 'teachers')}
          />
          <StatCard
            label="Community reports"
            value={stats?.pendingCommunityReports}
            accent
            onPress={() => goTo('community')}
          />
        </View>
      </View>

      <View className="mt-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <Chip
            label={`Reviews (${reviews.length})`}
            selected={segment === 'reviews'}
            onPress={() => setSegment('reviews')}
          />
          <Chip
            label={`Uploads (${uploads.length})`}
            selected={segment === 'uploads'}
            onPress={() => setSegment('uploads')}
          />
          <Chip
            label={`Teachers (${adminTeachers.length})`}
            selected={segment === 'teachers'}
            onPress={() => setSegment('teachers')}
          />
          <Chip
            label={`Community (${communityReports.length})`}
            selected={segment === 'community'}
            onPress={() => setSegment('community')}
          />
          <Chip
            label="Links"
            selected={segment === 'links'}
            onPress={() => setSegment('links')}
          />
          <Chip
            label="Settings"
            selected={segment === 'settings'}
            onPress={() => setSegment('settings')}
          />
        </ScrollView>
      </View>

      {loading ? (
        <CardSkeletonList />
      ) : error ? (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load admin data"
          subtitle={error}
          onRetry={load}
        />
      ) : (
        <Animated.View style={{ flex: 1, opacity: segmentOpacity }}>
          {warning && (
            <View className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
              <Text className="text-xs text-red-700 dark:text-red-300">{warning}</Text>
            </View>
          )}
          {segment === 'reviews' ? (
            <FlatList
              data={reviews}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              keyboardDismissMode="on-drag"
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              ItemSeparatorComponent={() => (
                <View className="mb-3 h-px bg-line dark:bg-line-dark" />
              )}
              renderItem={({ item, index }) => (
                <AnimatedListItem index={index}>
                  <AdminReviewCard
                    review={item}
                    onApprove={() => handleApproveReview(item)}
                    onReject={() => handleRejectReview(item)}
                  />
                </AnimatedListItem>
              )}
              ListEmptyComponent={
                <StateMessage icon="checkmark-circle-outline" title="No pending reviews 🎉" />
              }
            />
          ) : segment === 'uploads' ? (
            <View style={{ flex: 1 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                <Chip
                  label={`Pending (${uploads.length})`}
                  selected={uploadsView === 'pending'}
                  onPress={() => setUploadsView('pending')}
                />
                <Chip
                  label={`Published (${publishedUploads.length})`}
                  selected={uploadsView === 'published'}
                  onPress={() => setUploadsView('published')}
                />
              </ScrollView>
              <FlatList
                data={uploadsView === 'pending' ? uploads : publishedUploads}
                keyExtractor={(u) => u.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                keyboardDismissMode="on-drag"
                refreshing={refreshing}
                onRefresh={() => load('refresh')}
                ItemSeparatorComponent={() => (
                  <View className="mb-3 h-px bg-line dark:bg-line-dark" />
                )}
                renderItem={({ item, index }) => (
                  <AnimatedListItem index={index}>
                    <AdminUploadCard
                      upload={item}
                      departments={adminDepartments}
                      onApprove={uploadsView === 'pending' ? () => handleApproveUpload(item) : undefined}
                      onReject={uploadsView === 'pending' ? () => handleRejectUpload(item) : undefined}
                      onDelete={uploadsView === 'published' ? () => handleDeletePublishedUpload(item) : undefined}
                      onSave={(input) => handleUpdateUpload(item, input, uploadsView)}
                    />
                  </AnimatedListItem>
                )}
                ListEmptyComponent={
                  <StateMessage
                    icon="checkmark-circle-outline"
                    title={uploadsView === 'pending' ? 'No pending uploads 🎉' : 'Nothing published yet'}
                  />
                }
              />
            </View>
          ) : segment === 'teachers' ? (
            <AdminTeachersPanel
              step={teacherStep}
              onStepChange={setTeacherStep}
              departments={departments}
              adminDepartments={adminDepartments}
              courses={adminCourses}
              teachers={adminTeachers}
              suggestions={teacherSuggestions}
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              onAddDepartment={handleAddDepartment}
              onDeleteDepartment={handleDeleteDepartment}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
              onAssignTeacherCourse={handleAssignTeacherCourse}
              onAddTeacher={handleAddTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onApproveSuggestion={handleApproveSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
            />
          ) : segment === 'community' ? (
            <FlatList
              data={communityReports}
              keyExtractor={(item) => `${item.kind}-${item.id}`}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
              keyboardDismissMode="on-drag"
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              renderItem={({ item, index }) => (
                <AnimatedListItem index={index}>
                  <AdminCommunityCard
                    report={item}
                    onDismiss={() => handleDismissCommunityReport(item)}
                    onHide={() => handleHideCommunityItem(item)}
                  />
                </AnimatedListItem>
              )}
              ListEmptyComponent={
                <StateMessage icon="checkmark-circle-outline" title="No community reports" />
              }
            />
          ) : segment === 'links' ? (
            <AdminLinksPanel />
          ) : (
            <AdminSettingsPanel />
          )}
        </Animated.View>
      )}
    </Screen>
  );
}
