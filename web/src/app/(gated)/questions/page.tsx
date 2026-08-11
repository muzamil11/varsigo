'use client';

import { ArrowBigUp, MessageCircle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, Screen, StateMessage } from '@/components';
import { fetchDepartments } from '@/features/departments/api';
import type { Department } from '@/features/departments/types';
import type { QuestionListItem } from '@/features/questions/data';
import { fetchQuestions, submitQuestion, toggleQuestionVote } from '@/features/questions/api';
import { useAuthStore } from '@/store/authStore';

export default function QuestionsPage() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [askTeacherId, setAskTeacherId] = useState<string | null>(null);
  const [askTeacherName, setAskTeacherName] = useState<string | null>(null);
  const [askPaperId, setAskPaperId] = useState<string | null>(null);
  const [askPaperName, setAskPaperName] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Arriving from a teacher's review page or a paper card's "Ask a
  // question" link — open straight into the form with that teacher/paper
  // pre-linked.
  useEffect(() => {
    if (searchParams.get('openAsk') !== '1') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional, reading a one-time nav param
    setShowForm(true);
    setAskTeacherId(searchParams.get('askTeacherId'));
    setAskTeacherName(searchParams.get('askTeacherName'));
    setAskPaperId(searchParams.get('askPaperId'));
    setAskPaperName(searchParams.get('askPaperName'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    fetchQuestions(user.id)
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    load();
    fetchDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePost = async () => {
    if (!user || title.trim().length === 0) return;
    setPosting(true);
    try {
      await submitQuestion({
        userId: user.id,
        title,
        body,
        departmentId: departmentId || null,
        isAnonymous,
        teacherId: askTeacherId,
        paperId: askPaperId,
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      setAskTeacherId(null);
      setAskTeacherName(null);
      setAskPaperId(null);
      setAskPaperName(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post question.');
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (id: string) => {
    try {
      await toggleQuestionVote(id);
      load();
    } catch {
      // best-effort
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
              Student Q&amp;A
            </h1>
            <p className="text-sm text-muted dark:text-muted-dark">
              Ask and answer questions with other NED students.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"
          >
            <Plus size={18} color="#FFFFFF" />
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
            {(askTeacherName || askPaperName) && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
                <span className="text-sm font-medium text-accent">
                  About: {askTeacherName ?? askPaperName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAskTeacherId(null);
                    setAskTeacherName(null);
                    setAskPaperId(null);
                    setAskPaperName(null);
                  }}
                  className="text-accent"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your question"
              className="mb-2 h-11 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Add more detail (optional)"
              className="mb-2 w-full rounded-lg border border-line bg-background p-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="mb-2 h-11 w-full rounded-lg border border-line bg-background px-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
            >
              <option value="">No specific department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <label className="mb-3 flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Post anonymously
            </label>
            <Button label="Post question" onPress={handlePost} loading={posting} disabled={title.trim().length === 0} />
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        {loading ? (
          <CardSkeletonList padded={false} />
        ) : questions.length === 0 ? (
          <StateMessage icon={MessageCircle} title="No questions yet" subtitle="Be the first to ask." />
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="mb-3 flex gap-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
            >
              <button
                type="button"
                onClick={() => handleVote(q.id)}
                className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border ${
                  q.votedByMe ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
                }`}
              >
                <ArrowBigUp size={16} />
                <span className="text-xs">{q.upvoteCount}</span>
              </button>
              <Link href={`/questions/${q.id}`} className="flex-1">
                <p className="font-semibold text-foreground dark:text-foreground-dark">{q.title}</p>
                {q.body && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted dark:text-muted-dark">{q.body}</p>
                )}
                {(q.teacherName || q.paperTitle) && (
                  <span className="mt-1.5 inline-flex rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    About {q.teacherName ?? q.paperTitle}
                  </span>
                )}
                <p className="mt-2 text-xs text-muted dark:text-muted-dark">
                  {q.author} · {q.department ?? 'General'} · {q.answerCount} answer
                  {q.answerCount === 1 ? '' : 's'} · {q.createdAt}
                </p>
              </Link>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}
