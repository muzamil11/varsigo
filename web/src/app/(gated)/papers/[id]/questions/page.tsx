'use client';

import { ArrowBigUp, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, Screen, StateMessage } from '@/components';
import type { QuestionListItem } from '@/features/questions/data';
import { fetchQuestions, toggleQuestionVote } from '@/features/questions/api';
import { useAuthStore } from '@/store/authStore';

/** Papers have no comment section, so this is the "discussion" for a single
 *  paper — every question already linked to it (paper_id), plus a shortcut
 *  to ask a new one. Reached from the paper card's question-count chip. */
export default function PaperQuestionsPage() {
  const params = useParams<{ id: string }>();
  const paperId = params.id;
  const searchParams = useSearchParams();
  const paperTitle = searchParams.get('title');
  const user = useAuthStore((s) => s.user);

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchQuestions(user?.id, { paperId })
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId, user?.id]);

  const handleVote = async (id: string) => {
    try {
      await toggleQuestionVote(id);
      load();
    } catch {
      // best-effort
    }
  };

  const askHref = `/questions?askPaperId=${paperId}&askPaperName=${encodeURIComponent(paperTitle ?? 'this paper')}&openAsk=1`;

  return (
    <Screen>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/papers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted dark:text-muted-dark"
        >
          <ArrowLeft size={14} />
          Back to papers
        </Link>

        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground dark:text-foreground-dark">
              Questions about this paper
            </h1>
            {paperTitle && (
              <p className="text-sm text-muted dark:text-muted-dark">{paperTitle}</p>
            )}
          </div>
          <Link href={askHref}>
            <Button label="Ask a question" />
          </Link>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        {loading ? (
          <CardSkeletonList padded={false} />
        ) : questions.length === 0 ? (
          <StateMessage
            icon={MessageCircle}
            title="No questions yet"
            subtitle="Be the first to ask something about this paper."
          />
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
                  q.votedByMe
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
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
                <p className="mt-2 text-xs text-muted dark:text-muted-dark">
                  {q.author} · {q.answerCount} answer{q.answerCount === 1 ? '' : 's'} · {q.createdAt}
                </p>
              </Link>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}
