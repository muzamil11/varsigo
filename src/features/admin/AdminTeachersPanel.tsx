import React, { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

import { AnimatedListItem, Button, Card, Chip, StateMessage } from '@/components';
import type { Department } from '@/features/departments/types';
import { formatCourse } from '@/features/courses/types';
import { useThemeColors } from '@/store/themeStore';
import { AdminTeacherRow } from './AdminTeacherRow';
import type { AdminCourse, AdminDepartment, AdminTeacher, TeacherSuggestion } from './data';
import { TeacherSuggestionCard } from './TeacherSuggestionCard';

interface AdminTeachersPanelProps {
  departments: Department[];
  adminDepartments: AdminDepartment[];
  courses: AdminCourse[];
  teachers: AdminTeacher[];
  suggestions: TeacherSuggestion[];
  refreshing: boolean;
  onRefresh: () => void;
  onAddDepartment: (name: string) => Promise<void>;
  onDeleteDepartment: (department: AdminDepartment) => void;
  onAddCourse: (name: string, code: string, departmentId: string) => Promise<void>;
  onDeleteCourse: (course: AdminCourse) => void;
  onAssignTeacherCourse: (teacherId: string, courseId: string) => Promise<void>;
  onAddTeacher: (name: string, departmentId: string, courseIds: string[]) => Promise<void>;
  onDeleteTeacher: (teacher: AdminTeacher) => void;
  onApproveSuggestion: (suggestion: TeacherSuggestion) => void;
  onRejectSuggestion: (suggestion: TeacherSuggestion) => void;
}

export function AdminTeachersPanel({
  departments,
  adminDepartments,
  courses,
  teachers,
  suggestions,
  refreshing,
  onRefresh,
  onAddDepartment,
  onDeleteDepartment,
  onAddCourse,
  onDeleteCourse,
  onAssignTeacherCourse,
  onAddTeacher,
  onDeleteTeacher,
  onApproveSuggestion,
  onRejectSuggestion,
}: AdminTeachersPanelProps) {
  const colors = useThemeColors();
  const [departmentName, setDepartmentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseDeptId, setCourseDeptId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [assignTeacherId, setAssignTeacherId] = useState<string | null>(null);
  const [assignCourseId, setAssignCourseId] = useState<string | null>(null);
  const [submittingDepartment, setSubmittingDepartment] = useState(false);
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState(false);

  const isValid = name.trim().length > 0 && departmentId !== null;
  const isDepartmentValid = departmentName.trim().length > 0;
  const isCourseValid = courseName.trim().length > 0 && courseDeptId !== null;
  const isAssignValid = assignTeacherId !== null && assignCourseId !== null;

  const filteredCourses = departmentId
    ? courses.filter((course) => !course.departmentId || course.departmentId === departmentId)
    : courses;

  const handleDepartmentSubmit = async () => {
    if (!isDepartmentValid) return;
    setSubmittingDepartment(true);
    try {
      await onAddDepartment(departmentName.trim());
      setDepartmentName('');
    } catch {
      // onAddDepartment already shows the Alert; keep text for retry.
    } finally {
      setSubmittingDepartment(false);
    }
  };

  const handleCourseSubmit = async () => {
    if (!isCourseValid || !courseDeptId) return;
    setSubmittingCourse(true);
    try {
      await onAddCourse(courseName.trim(), courseCode.trim(), courseDeptId);
      setCourseName('');
      setCourseCode('');
      setCourseDeptId(null);
    } catch {
      // onAddCourse shows the Alert.
    } finally {
      setSubmittingCourse(false);
    }
  };

  const toggleSelectedCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const handleAssignSubmit = async () => {
    if (!isAssignValid || !assignTeacherId || !assignCourseId) return;
    setAssigningCourse(true);
    try {
      await onAssignTeacherCourse(assignTeacherId, assignCourseId);
      setAssignTeacherId(null);
      setAssignCourseId(null);
    } catch {
      // onAssignTeacherCourse shows the Alert.
    } finally {
      setAssigningCourse(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || !departmentId) return;
    setSubmitting(true);
    try {
      await onAddTeacher(name.trim(), departmentId, selectedCourseIds);
      setName('');
      setDepartmentId(null);
      setSelectedCourseIds([]);
    } catch {
      // onAddTeacher already surfaces its own Alert — keep the form filled
      // in so the admin can just retry rather than retyping everything.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FlatList
      data={teachers}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshing={refreshing}
      onRefresh={onRefresh}
      ItemSeparatorComponent={() => <View className="mb-3 h-px bg-line dark:bg-line-dark" />}
      ListHeaderComponent={
        <>
          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Add Department
            </Text>
            <TextInput
              value={departmentName}
              onChangeText={setDepartmentName}
              placeholder="Department name"
              placeholderTextColor={colors.textMuted}
              className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <Button
              label="Add Department"
              onPress={handleDepartmentSubmit}
              disabled={!isDepartmentValid}
              loading={submittingDepartment}
            />
          </Card>

          <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Existing Departments
          </Text>
          {adminDepartments.length > 0 ? (
            <View className="mb-4">
              {adminDepartments.map((department) => (
                <Card key={department.id} className="mb-3 flex-row items-center">
                  <Text className="flex-1 text-base font-semibold text-foreground dark:text-foreground-dark">
                    {department.name}
                  </Text>
                  <Button
                    label="Delete"
                    variant="ghost"
                    onPress={() => onDeleteDepartment(department)}
                    className="h-9 px-3"
                  />
                </Card>
              ))}
            </View>
          ) : (
            <StateMessage icon="business-outline" title="No departments yet" />
          )}

          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Add Course
            </Text>
            <TextInput
              value={courseName}
              onChangeText={setCourseName}
              placeholder="Course name"
              placeholderTextColor={colors.textMuted}
              className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <TextInput
              value={courseCode}
              onChangeText={setCourseCode}
              placeholder="Course code (optional)"
              autoCapitalize="characters"
              placeholderTextColor={colors.textMuted}
              className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <View className="mb-3 flex-row flex-wrap">
              {departments.length > 0 ? (
                departments.map((d) => (
                  <Chip
                    key={d.id}
                    label={d.name}
                    selected={courseDeptId === d.id}
                    onPress={() => setCourseDeptId(d.id)}
                  />
                ))
              ) : (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Add a department before adding courses.
                </Text>
              )}
            </View>
            <Button
              label="Add Course"
              onPress={handleCourseSubmit}
              disabled={!isCourseValid}
              loading={submittingCourse}
            />
          </Card>

          <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Existing Courses
          </Text>
          {courses.length > 0 ? (
            <View className="mb-4">
              {courses.map((course) => (
                <Card key={course.id} className="mb-3 flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">
                      {formatCourse(course)}
                    </Text>
                    {course.department && (
                      <Text className="mt-0.5 text-xs text-muted dark:text-muted-dark">
                        {course.department}
                      </Text>
                    )}
                  </View>
                  <Button
                    label="Delete"
                    variant="ghost"
                    onPress={() => onDeleteCourse(course)}
                    className="h-9 px-3"
                  />
                </Card>
              ))}
            </View>
          ) : (
            <StateMessage icon="book-outline" title="No courses yet" />
          )}

          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Add Teacher
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Teacher name"
              placeholderTextColor={colors.textMuted}
              className="mb-3 h-12 rounded-xl border border-line bg-background px-3 text-base text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <View className="mb-3 flex-row flex-wrap">
              {departments.length > 0 ? (
                departments.map((d) => (
                  <Chip
                    key={d.id}
                    label={d.name}
                    selected={departmentId === d.id}
                    onPress={() => {
                      setDepartmentId(d.id);
                      setSelectedCourseIds((ids) =>
                        ids.filter((courseId) =>
                          courses.some(
                            (course) =>
                              course.id === courseId &&
                              (!course.departmentId || course.departmentId === d.id),
                          ),
                        ),
                      );
                    }}
                  />
                ))
              ) : (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Add a department before adding teachers.
                </Text>
              )}
            </View>
            <Text className="mb-2 text-xs font-semibold uppercase text-muted dark:text-muted-dark">
              Courses taught
            </Text>
            <View className="mb-3 flex-row flex-wrap">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <Chip
                    key={course.id}
                    label={formatCourse(course)}
                    selected={selectedCourseIds.includes(course.id)}
                    onPress={() => toggleSelectedCourse(course.id)}
                  />
                ))
              ) : (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Add courses first, or add the teacher now and assign courses later.
                </Text>
              )}
            </View>
            <Button
              label="Add Teacher"
              onPress={handleSubmit}
              disabled={!isValid}
              loading={submitting}
            />
          </Card>

          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
              Assign Course to Existing Teacher
            </Text>
            <Text className="mb-2 text-xs font-semibold uppercase text-muted dark:text-muted-dark">
              Teacher
            </Text>
            <View className="mb-3 flex-row flex-wrap">
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <Chip
                    key={teacher.id}
                    label={teacher.name}
                    selected={assignTeacherId === teacher.id}
                    onPress={() => setAssignTeacherId(teacher.id)}
                  />
                ))
              ) : (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Add a teacher first.
                </Text>
              )}
            </View>
            <Text className="mb-2 text-xs font-semibold uppercase text-muted dark:text-muted-dark">
              Course
            </Text>
            <View className="mb-3 flex-row flex-wrap">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <Chip
                    key={course.id}
                    label={formatCourse(course)}
                    selected={assignCourseId === course.id}
                    onPress={() => setAssignCourseId(course.id)}
                  />
                ))
              ) : (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Add a course first.
                </Text>
              )}
            </View>
            <Button
              label="Assign Course"
              onPress={handleAssignSubmit}
              disabled={!isAssignValid}
              loading={assigningCourse}
            />
          </Card>

          {suggestions.length > 0 && (
            <>
              <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
                Suggested Teachers
              </Text>
              {suggestions.map((s, index) => (
                <AnimatedListItem key={s.id} index={index}>
                  <TeacherSuggestionCard
                    suggestion={s}
                    onApprove={() => onApproveSuggestion(s)}
                    onReject={() => onRejectSuggestion(s)}
                  />
                </AnimatedListItem>
              ))}
            </>
          )}

          <Text className="mb-3 text-base font-semibold text-foreground dark:text-foreground-dark">
            Existing Teachers
          </Text>
        </>
      }
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <AdminTeacherRow teacher={item} onDelete={() => onDeleteTeacher(item)} />
        </AnimatedListItem>
      )}
      ListEmptyComponent={<StateMessage icon="people-outline" title="No teachers yet" />}
    />
  );
}
