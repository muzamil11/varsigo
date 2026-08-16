'use client';

import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { CardSkeletonList, StateMessage, Switch } from '@/components';
import { fetchModerationSettings, updateModerationSettings } from '@/features/settings/api';
import type { ModerationSettings } from '@/features/settings/data';
import { useAuthStore } from '@/store/authStore';

const TOGGLES: { key: keyof ModerationSettings; label: string; subtitle: string }[] = [
  {
    key: 'reviewsRequireApproval',
    label: 'Teacher reviews',
    subtitle: 'New reviews wait for admin approval before appearing publicly.',
  },
  {
    key: 'uploadsRequireApproval',
    label: 'Past papers & notes',
    subtitle: 'New uploads wait for admin approval before appearing in Papers.',
  },
  {
    key: 'teacherSuggestionsRequireApproval',
    label: 'Teacher suggestions',
    subtitle: 'Student-suggested teachers wait for admin approval before being added.',
  },
  {
    key: 'importantLinksRequireApproval',
    label: 'Important Links',
    subtitle: 'Student-suggested links wait for admin approval before appearing on Home.',
  },
];

/** Global on/off switches for the "requires admin approval" behavior on
 *  each user-submission flow — flip one off and future submissions for
 *  that content type insert already approved, no code change needed.
 *  Doesn't cover Lost & Found, which always goes through a separate
 *  Supabase Edge Function (see supabase/schema.sql's moderation_settings
 *  comment) rather than a direct client insert this app controls. */
export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof ModerationSettings | null>(null);

  const load = () => {
    setLoading(true);
    fetchModerationSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
  useEffect(load, []);

  const handleToggle = async (key: keyof ModerationSettings, value: boolean) => {
    if (!user?.email || !settings) return;
    const previous = settings;
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);
    try {
      await updateModerationSettings(user.email, { [key]: value });
    } catch (err) {
      setSettings(previous);
      setError(err instanceof Error ? err.message : 'Could not update setting.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <CardSkeletonList padded={false} />;
  if (error && !settings) {
    return <StateMessage icon={AlertTriangle} title="Couldn't load settings" subtitle={error} />;
  }
  if (!settings) return null;

  return (
    <div>
      <p className="mb-4 text-xs text-muted dark:text-muted-dark">
        Turn a switch off to auto-approve that content type immediately on submit — no admin review,
        no code change. Turn it back on any time to go back to requiring approval.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
          {error}
        </p>
      )}

      {TOGGLES.map((toggle) => (
        <div
          key={toggle.key}
          className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 dark:border-line-dark dark:bg-card-dark"
        >
          <div>
            <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
              {toggle.label}
            </p>
            <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">{toggle.subtitle}</p>
          </div>
          <Switch
            checked={settings[toggle.key]}
            onChange={(value) => handleToggle(toggle.key, value)}
            label={toggle.label}
          />
        </div>
      ))}

      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 opacity-60 dark:border-line-dark dark:bg-card-dark">
        <div>
          <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
            Lost & Found
          </p>
          <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
            Handled by a separate server function — not controllable from here.
          </p>
        </div>
      </div>
    </div>
  );
}
