// Logic for the Compare Teachers page (src/app/teachers/compare and
// src/features/teachers/CompareTeachers.tsx): picking a per-teacher chart
// color, bucketing each teacher's reviews into positive/neutral/negative,
// and deciding whether a "winner" can be declared without overclaiming from
// thin data.
//
// The winner/metric helpers below only touch rating/reviewCount/breakdown,
// so they take the lighter `TeacherListItem` shape rather than the full
// `TeacherDetail` — the public numeric comparison sections render from
// public aggregate data (fetchTeachersByIds), while review text (used by
// summarizeForCompare) is only ever fetched client-side after sign-in.

import {
  MIN_REVIEWS_FOR_QUALITY_TAG,
  reviewOverall,
  reviewSentiment,
  TEACHER_QUALITY_TAGS,
  type TeacherBreakdown,
  type TeacherDetail,
  type TeacherListItem,
  type TeacherQualityKey,
} from './data';

/** A breakdown dimension's average is only ever 0 when fetchTeachers/
 *  fetchTeachersByIds had zero contributing reviews to average (most often
 *  `helpfulness`, for teachers whose reviews predate that column) — a real
 *  average of 1-5 scores can never round to 0. Reads that as "no data yet"
 *  rather than a damning 0.0, which the bar rows below would otherwise show
 *  next to a teacher who simply hasn't been rated on that dimension. */
export function breakdownMetricValue(
  breakdown: TeacherBreakdown | null,
  key: TeacherQualityKey,
): number | null {
  if (!breakdown) return null;
  return breakdown[key] > 0 ? breakdown[key] : null;
}

// Same in both themes, like the app's accent color — these need to stay
// visually distinct from each other (not just from the background), so
// they're fixed rather than pulled from the light/dark palette.
export const COMPARE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899'];

export function compareColorAt(index: number): string {
  return COMPARE_COLORS[index % COMPARE_COLORS.length];
}

export interface TeacherCompareSummary {
  positive: number;
  neutral: number;
  negative: number;
}

/** Quick-scan counts only — the compare page lists every review in full
 *  underneath these (not a curated "top quote"), so a student isn't limited
 *  to an algorithm's pick and can read everything themselves. */
export function summarizeForCompare(teacher: TeacherDetail): TeacherCompareSummary {
  const summary: TeacherCompareSummary = { positive: 0, neutral: 0, negative: 0 };
  for (const review of teacher.reviews) {
    summary[reviewSentiment(reviewOverall(review))]++;
  }
  return summary;
}

/** A teacher's rating is only trustworthy enough to "win" a comparison once
 *  a few students have weighed in — same bar as the Teachers page's quality
 *  tags (TEACHER_QUALITY_TAGS), so a teacher with a single 5-star review
 *  can't out-rank one with a dozen mixed reviews. */
function isEligible(teacher: TeacherListItem): boolean {
  return teacher.rating !== null && teacher.reviewCount >= MIN_REVIEWS_FOR_QUALITY_TAG;
}

/** Returns the id of the teacher with the highest overall rating, or null
 *  when no teacher has enough reviews yet, or the top two are tied (ties
 *  shouldn't be resolved by an arbitrary sort order). */
export function computeOverallWinnerId(teachers: TeacherListItem[]): string | null {
  const eligible = teachers.filter(isEligible);
  if (eligible.length === 0) return null;
  const sorted = [...eligible].sort(
    (a, b) => b.rating! - a.rating! || b.reviewCount - a.reviewCount,
  );
  if (
    sorted.length > 1 &&
    sorted[0].rating === sorted[1].rating &&
    sorted[0].reviewCount === sorted[1].reviewCount
  ) {
    return null;
  }
  return sorted[0].id;
}

/** Same idea as computeOverallWinnerId but for one rating dimension (e.g.
 *  "grading") — powers the small trophy shown next to the leading bar in
 *  each metric row. */
export function computeMetricWinnerId(teachers: TeacherListItem[], key: TeacherQualityKey): string | null {
  const eligible = teachers.filter((t) => t.breakdown && isEligible(t));
  if (eligible.length < 2) return null;
  const sorted = [...eligible].sort((a, b) => b.breakdown![key] - a.breakdown![key]);
  if (sorted[0].breakdown![key] === sorted[1].breakdown![key]) return null;
  return sorted[0].id;
}

/** Up to two concrete, numbers-backed reasons the winner edged out the
 *  others — e.g. "Grading 4.5 vs 3.2" — so the recommendation reads as
 *  derived from the data rather than an unexplained pick. Falls back to the
 *  overall rating when no single dimension stands out by a meaningful
 *  margin (>= 0.3). */
export function buildWinnerReasons(winner: TeacherListItem, others: TeacherListItem[]): string[] {
  const reasons: string[] = [];
  for (const tag of TEACHER_QUALITY_TAGS) {
    const winnerValue = winner.breakdown?.[tag.key];
    if (winnerValue == null) continue;
    const otherValues = others
      .map((o) => o.breakdown?.[tag.key])
      .filter((v): v is number => v != null);
    if (otherValues.length === 0) continue;
    const maxOther = Math.max(...otherValues);
    if (winnerValue - maxOther >= 0.3) {
      reasons.push(`${tag.label} ${winnerValue.toFixed(1)} vs ${maxOther.toFixed(1)}`);
    }
  }
  return reasons.slice(0, 2);
}
