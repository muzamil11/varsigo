'use client';

import { ArrowBigUp, CheckCircle2, Flag } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, CardSkeletonList, Screen, StateMessage } from '@/components';
import type { QuestionDetail } from '@/features/questions/data';
import {
  fetchQuestionById,
  reportAnswer,
  reportQuestion,
  submitAnswer,
  toggleAnswerVote,
  toggleQuestionVote,
} from '@/features/questions/api';
import { useAuthStore } from '@/store/authStore';
import { MessageCircle } from 'lucide-react';

export default function QuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const questionId = params.id;
  const user = useAuthStore((s) => s.user);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerBody, setAnswerBody] = useState('');
  const [answerAnon, setAnswerAnon] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchQuestionById(questionId, user?.id)
      .then(setQuestion)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional load-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, user?.id]);

  const handleAnswer = async () => {
    if (!user || answerBody.trim().length === 0) return;
    setPosting(true);
    try {
      await submitAnswer({ questionId, userId: user.id, body: answerBody, isAnonymous: answerAnon });
      setAnswerBody('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post answer.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <CardSkeletonList padded={false} count={2} />
        </div>
      </Screen>
    );
  }

  if (error || !question) {
    return (
      <Screen>
        <StateMessage icon={MessageCircle} title="Couldn't load question" subtitle={error ?? undefined} />
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => toggleQuestionVote(questionId).then(load)}
              className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border ${
                question.votedByMe
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
              }`}
            >
              <ArrowBigUp size={16} />
              <span className="text-xs">{question.upvoteCount}</span>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground dark:text-foreground-dark">
                {question.title}
              </h1>
              {question.body && (
                <p className="mt-2 text-sm text-foreground dark:text-foreground-dark">{question.body}</p>
              )}
              {question.teacherName && (
                <span className="mt-2 inline-flex rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  About {question.teacherName}
                </span>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-muted dark:text-muted-dark">
                <span>
                  {question.author} · {question.department ?? 'General'} · {question.createdAt}
                </span>
                <button
                  type="button"
                  onClick={() => reportQuestion(questionId).then(load)}
                  disabled={question.reportedByMe}
                  className="flex items-center gap-1 disabled:opacity-50"
                >
                  <Flag size={12} />
                  {question.reportedByMe ? 'Reported' : 'Report'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-base font-semibold text-foreground dark:text-foreground-dark">
          {question.answers.length} Answer{question.answers.length === 1 ? '' : 's'}
        </h2>

        {question.answers.map((answer) => (
          <div
            key={answer.id}
            className="mb-3 flex gap-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark"
          >
            <button
              type="button"
              onClick={() => toggleAnswerVote(answer.id).then(load)}
              className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border ${
                answer.votedByMe
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-line text-muted dark:border-line-dark dark:text-muted-dark'
              }`}
            >
              <ArrowBigUp size={16} />
              <span className="text-xs">{answer.upvoteCount}</span>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-foreground dark:text-foreground-dark">{answer.body}</p>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted dark:text-muted-dark">
                <span className="flex items-center gap-1">
                  {answer.accepted && <CheckCircle2 size={12} className="text-accent" />}
                  {answer.author} · {answer.createdAt}
                </span>
                <button
                  type="button"
                  onClick={() => reportAnswer(answer.id).then(load)}
                  disabled={answer.reportedByMe}
                  className="flex items-center gap-1 disabled:opacity-50"
                >
                  <Flag size={12} />
                  {answer.reportedByMe ? 'Reported' : 'Report'}
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
          <p className="mb-2 text-sm font-medium text-foreground dark:text-foreground-dark">
            Write an answer
          </p>
          <textarea
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            rows={3}
            className="mb-2 w-full rounded-lg border border-line bg-background p-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-background-dark dark:text-foreground-dark"
          />
          <label className="mb-3 flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
            <input type="checkbox" checked={answerAnon} onChange={(e) => setAnswerAnon(e.target.checked)} />
            Post anonymously
          </label>
          <Button
            label="Post answer"
            onPress={handleAnswer}
            loading={posting}
            disabled={answerBody.trim().length === 0}
          />
        </div>
      </div>
    </Screen>
  );
}
