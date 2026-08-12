'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, Select, StateMessage } from '@/components';
import { addCourse, deleteCourse, fetchAdminCourses } from '@/features/admin/api';
import type { AdminCourse } from '@/features/admin/data';
import { fetchAdminDepartments } from '@/features/admin/api';
import type { AdminDepartment } from '@/features/admin/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    Promise.all([fetchAdminCourses(user.email), fetchAdminDepartments(user.email)])
      .then(([c, d]) => {
        setCourses(c);
        setDepartments(d);
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
      await addCourse({ adminEmail: user.email, name, code, departmentId });
      setName('');
      setCode('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add course.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) return;
    try {
      await deleteCourse(user.email, id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete course.');
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Course name"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark sm:col-span-2"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code (optional)"
          className="h-11 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <Select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="h-11 rounded-lg border border-line bg-card pl-3 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        >
          <option value="">Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </div>
      <Button
        label="Add course"
        onPress={handleAdd}
        loading={adding}
        disabled={name.trim().length === 0 || !departmentId}
        className="mb-4"
      />

      {error && (
        <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {error}
        </p>
      )}

      {loading ? (
        <CardSkeletonList padded={false} />
      ) : courses.length === 0 ? (
        <StateMessage icon={AlertTriangle} title="No courses yet" />
      ) : (
        courses.map((c) => (
          <div
            key={c.id}
            className="mb-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
          >
            <span className="text-sm text-foreground dark:text-foreground-dark">
              {c.code ? `${c.code} — ${c.name}` : c.name}{' '}
              <span className="text-muted dark:text-muted-dark">({c.department ?? 'No department'})</span>
            </span>
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
