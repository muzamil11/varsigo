'use client';

import { Star } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button, Chip, Screen } from '@/components';
import { formatCourse } from '@/features/courses/types';
import { fetchTeacherPublicById, submitReview } from '@/features/teachers/api';
import type { TeacherDetail } from '@/features/teachers/data';
import { useAuthStore } from '@/store/authStore';

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string;
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
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        comment: trimmedComment,
        isAnonymous,
      });
      // Keep the spinner through the navigation instead of resetting it
      // first — see login/page.tsx's comment for why.
      router.push(`/teachers/${teacherId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review.');
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground dark:text-foreground-dark">
          Review {teacher?.name ?? 'this teacher'}
        </h1>
        <p className="mb-6 text-sm text-muted dark:text-muted-dark">
          Your review is moderated before it appears publicly.
        </p>

        <ScoreSelector label="Teaching quality" value={teaching} onChange={setTeaching} />
        <ScoreSelector label="Grading fairness" value={grading} onChange={setGrading} />
        <ScoreSelector label="Attendance strictness" value={attendance} onChange={setAttendance} />

        {teacher && teacher.courses.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-foreground dark:text-foreground-dark">
              Course context
            </p>
            <p className="mb-3 text-xs text-muted dark:text-muted-dark">
              Optional. Pick the course this review is about.
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
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

        <label className="mb-6 flex items-center gap-2 text-sm text-foreground dark:text-foreground-dark">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          Post anonymously
        </label>

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
