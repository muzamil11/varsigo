'use client';

import { AlertTriangle, Check, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, Combobox, StateMessage } from '@/components';
import {
  addTeacher,
  approveTeacherSuggestion,
  assignTeacherCourse,
  deleteTeacher,
  fetchAdminCourses,
  fetchAdminDepartments,
  fetchAdminTeachers,
  fetchPendingTeacherSuggestions,
  rejectTeacherSuggestion,
} from '@/features/admin/api';
import type { AdminCourse, AdminDepartment, AdminTeacher, TeacherSuggestion } from '@/features/admin/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminTeachersListPage() {
  const user = useAuthStore((s) => s.user);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [suggestions, setSuggestions] = useState<TeacherSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [assignCourseId, setAssignCourseId] = useState<Record<string, string>>({});

  const coursesForNewTeacher = departmentId
    ? courses.filter((c) => c.departmentId === departmentId)
    : [];

  const toggleSelectedCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId],
    );
  };

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([
      fetchAdminTeachers(user.email),
      fetchAdminDepartments(user.email),
      fetchAdminCourses(user.email),
      fetchPendingTeacherSuggestions(user.email),
    ])
      .then(([t, d, c, s]) => {
        setTeachers(t);
        setDepartments(d);
        setCourses(c);
        setSuggestions(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const handleAdd = async () => {
    if (!user?.email || name.trim().length === 0 || !departmentId) return;
    setAdding(true);
    try {
      await addTeacher({ adminEmail: user.email, name, departmentId, courseIds: selectedCourseIds });
      setName('');
      setSelectedCourseIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add teacher.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) return;
    try {
      await deleteTeacher(user.email, id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete teacher.');
    }
  };

  const handleAssign = async (teacherId: string) => {
    const courseId = assignCourseId[teacherId];
    if (!user?.email || !courseId) return;
    try {
      await assignTeacherCourse(user.email, teacherId, courseId);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign course.');
    }
  };

  const handleApproveSuggestion = async (suggestion: TeacherSuggestion) => {
    if (!user?.email) return;
    try {
      await approveTeacherSuggestion(user.email, suggestion);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve suggestion.');
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    if (!user?.email) return;
    try {
      await rejectTeacherSuggestion(user.email, id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reject suggestion.');
    }
  };

  if (loading) return <CardSkeletonList padded={false} />;

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-foreground-dark">
            Pending suggestions
          </h2>
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="mb-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
            >
              <div>
                <p className="text-sm text-foreground dark:text-foreground-dark">{s.name}</p>
                <p className="text-xs text-muted dark:text-muted-dark">
                  {s.departmentName ?? 'No department'} · suggested by {s.suggestedBy}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveSuggestion(s)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectSuggestion(s.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Teacher name"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark sm:col-span-2"
        />
        <Combobox
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            setSelectedCourseIds([]);
          }}
          options={[
            { value: '', label: 'Department' },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
      </div>

      {departmentId && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs text-muted dark:text-muted-dark">
            Courses this teacher teaches (optional — can also assign later)
          </p>
          {coursesForNewTeacher.length === 0 ? (
            <p className="text-xs text-muted dark:text-muted-dark">
              No courses in this department yet — add some in the Courses tab first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {coursesForNewTeacher.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                    selectedCourseIds.includes(c.id)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={() => toggleSelectedCourse(c.id)}
                  />
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        label="Add teacher"
        onPress={handleAdd}
        loading={adding}
        disabled={name.trim().length === 0 || !departmentId}
        className="mb-4"
      />

      {teachers.length === 0 ? (
        <StateMessage icon={AlertTriangle} title="No teachers yet" />
      ) : (
        teachers.map((t) => (
          <div
            key={t.id}
            className="mb-2 rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground dark:text-foreground-dark">{t.name}</p>
                <p className="text-xs text-muted dark:text-muted-dark">
                  {t.department ?? 'No department'} ·{' '}
                  {t.courses.map((c) => c.code ?? c.name).join(', ') || 'No courses assigned'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <Combobox
                value={assignCourseId[t.id] ?? ''}
                onChange={(v) => setAssignCourseId((prev) => ({ ...prev, [t.id]: v }))}
                containerClassName="flex-1"
                options={[
                  {
                    value: '',
                    label: t.departmentId
                      ? 'Assign course…'
                      : 'Set a department first to assign courses',
                  },
                  // Filtered to the teacher's own department — an earlier version listed
                  // every course from every department here, making it easy to
                  // accidentally assign a teacher a course outside their own department.
                  ...courses
                    .filter((c) => c.departmentId === t.departmentId)
                    .map((c) => ({ value: c.id, label: c.code ? `${c.code} — ${c.name}` : c.name })),
                ]}
                className="h-9 rounded-lg border border-line bg-background px-2 text-xs text-foreground dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
              />
              <button
                type="button"
                onClick={() => handleAssign(t.id)}
                disabled={!t.departmentId}
                className="rounded-lg border border-line px-3 text-xs font-medium text-foreground disabled:opacity-50 dark:border-line-dark dark:text-foreground-dark"
              >
                Assign
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
