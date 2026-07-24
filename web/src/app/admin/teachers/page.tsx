'use client';

import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, StateMessage } from '@/components';
import { addDepartment, deleteDepartment, fetchAdminDepartments } from '@/features/admin/api';
import type { AdminDepartment } from '@/features/admin/data';
import { useAuthStore } from '@/store/authStore';

export default function AdminDepartmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [departments, setDepartments] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  const load = () => {
    if (!user?.email) return;
    setLoading(true);
    fetchAdminDepartments(user.email)
      .then(setDepartments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, [user?.email]);

  const handleAdd = async () => {
    if (!user?.email || name.trim().length === 0) return;
    setAdding(true);
    try {
      await addDepartment(user.email, name);
      setName('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add department.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.email) return;
    try {
      await deleteDepartment(user.email, id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete department.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New department name"
          className="h-11 flex-1 rounded-lg border border-line bg-card px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        <Button label="Add" onPress={handleAdd} loading={adding} disabled={name.trim().length === 0} />
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {error}
        </p>
      )}

      {loading ? (
        <CardSkeletonList padded={false} />
      ) : departments.length === 0 ? (
        <StateMessage icon={AlertTriangle} title="No departments yet" />
      ) : (
        departments.map((d) => (
          <div
            key={d.id}
            className="mb-2 flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
          >
            <span className="text-sm text-foreground dark:text-foreground-dark">{d.name}</span>
            <button
              type="button"
              onClick={() => handleDelete(d.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
      <div className="mt-2 flex items-center gap-1 text-xs text-muted dark:text-muted-dark">
        <Plus size={12} /> Manage courses and teachers from the tabs above.
      </div>
    </div>
  );
}
