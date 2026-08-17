'use client';

import { Clock, Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, Chip, Screen, Switch } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { fetchTeacherPublicById, submitReview } from '@/features/teachers/api';
import type { TeacherDetail } from '@/features/teachers/data';
import { useAuthStore } from '@/store/authStore';

function ScoreSelector({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-sm font-medium text-foreground dark:text-foreground-dark">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            aria-label={`${score} out of 5`}
          >
            <Star
              size={22}
              className={score <= value ? 'fill-accent text-accent' : 'text-line dark:text-line-dark'}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted dark:text-muted-dark">
        <span>1 · {low}</span>
        <span>5 · {high}</span>
      </div>
    </div>
  );
}

const MIN_COMMENT_LENGTH = 10;

export default function AddReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const teacherId = params.id;
  const user = useAuthStore((s) => s.user);

  const [teacher, setTeacher] = useState<
    Pick<TeacherDetail, 'id' | 'name' | 'department' | 'courses' | 'verificationStatus'> | null
  >(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [teaching, setTeaching] = useState(0);
  const [grading, setGrading] = useState(0);
  const [attendance, setAttendance] = useState(0);
  const [helpfulness, setHelpfulness] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherPublicById(teacherId)
      .then((t) => setTeacher(t))
      .catch(() => setTeacher(null));
  }, [teacherId]);

  const trimmedComment = comment.trim();
  const canSubmit =
    teaching > 0 &&
    grading > 0 &&
    attendance > 0 &&
    helpfulness > 0 &&
    trimmedComment.length >= MIN_COMMENT_LENGTH &&
    !submitting;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        teacherId,
        courseId,
        userId: user.id,
        teachingScore: teaching,
        gradingScore: grading,
        attendanceScore: attendance,
        helpfulnessScore: helpfulness,
        comment: trimmedComment,
        isAnonymous,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review.');
      setSubmitting(false);
    }
  };

  // There's no toast system on web yet (see ReviewsSection's handleReport),
  // so this confirmation screen is the only signal the reviewer gets that
  // their submission actually landed and is awaiting moderation — a plain
  // silent redirect back to the teacher page here would leave them unsure
  // whether the submit even worked.
  if (submitted) {
    return (
      <Screen>
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <Clock className="text-accent" size={28} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground dark:text-foreground-dark">
            Review submitted
          </h1>
          <p className="mt-2 text-sm text-muted dark:text-muted-dark">
            Thanks! Your review is pending moderation and will appear once approved.
          </p>
          <Button
            label="Back to teacher"
            onPress={() => router.push(`/teachers/${teacherId}`)}
            className="mt-6"
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Review {teacher?.name ?? 'this teacher'}
        </h1>
        <p className="mb-6 text-sm text-muted dark:text-muted-dark">
          Your review is moderated before it appears publicly.
        </p>

        <ScoreSelector
          label="Teaching quality"
          low="Poor"
          high="Excellent"
          value={teaching}
          onChange={setTeaching}
        />
        <ScoreSelector
          label="Grading fairness"
          low="Unfair"
          high="Very fair"
          value={grading}
          onChange={setGrading}
        />
        <ScoreSelector
          label="Attendance leniency"
          low="Very strict"
          high="Very lenient"
          value={attendance}
          onChange={setAttendance}
        />
        <ScoreSelector
          label="Helpfulness"
          low="Not approachable"
          high="Very approachable"
          value={helpfulness}
          onChange={setHelpfulness}
        />

        {teacher && teacher.courses.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-foreground dark:text-foreground-dark">
              Course context
            </p>
            <p className="mb-3 text-xs text-muted dark:text-muted-dark">
              Optional. Pick the course this review is about.
            </p>
            <div className="flex flex-wrap">
              <Chip label="General" selected={courseId === null} onPress={() => setCourseId(null)} />
              {teacher.courses.map((course) => (
                <Chip
                  key={course.id}
                  label={formatCourse(course)}
                  selected={courseId === course.id}
                  onPress={() => setCourseId(course.id)}
                />
              ))}
            </div>
          </div>
        )}

        <p className="mb-2 text-sm font-medium text-foreground dark:text-foreground-dark">
          Comment
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your experience with this teacher…"
          className="mb-4 w-full rounded-xl border border-line bg-card p-3 text-sm text-foreground outline-none dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark"
        />
        {trimmedComment.length < MIN_COMMENT_LENGTH && (
          <p className="mb-4 text-xs text-muted dark:text-muted-dark">
            Write at least {MIN_COMMENT_LENGTH} characters before submitting.
          </p>
        )}

        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
          <div>
            <p className="text-sm font-medium text-foreground dark:text-foreground-dark">
              Post anonymously
            </p>
            <p className="mt-0.5 text-xs text-muted dark:text-muted-dark">
              Your name will never be shown with this review.
            </p>
          </div>
          <Switch checked={isAnonymous} onChange={setIsAnonymous} label="Post anonymously" />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-foreground dark:border-line-dark dark:bg-card-dark dark:text-foreground-dark">
            {error}
          </p>
        )}

        <Button label="Submit review" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
      </div>
    </Screen>
  );
}
