import { isAdminEmail } from '@/lib/admin';
import { sanitizeText } from '@/lib/sanitize';
import { callCommunityFunction, isCommunityFunctionConfigured } from '@/lib/communityFunction';
import {
  callReportReviewFunction,
  callReviewFunction,
  isReportReviewFunctionConfigured,
} from '@/lib/reviewFunction';
import { supabase, toFriendlyError } from '@/lib/supabase';
import type { TeacherDetail, TeacherListItem, TeacherReview } from './data';
import { analyzeReviewQuality } from './quality';

const MAX_REVIEWS_PER_DAY = 3;

interface RawTeacherRow {
  id: string;
  name: string;
  verification_status: TeacherListItem['verificationStatus'] | null;
  departments: { id: string; name: string } | null;
}

interface RawReviewAggRow {
  teacher_id: string;
  teaching_score: number;
  grading_score: number;
  attendance_score: number;
}

interface RawReviewDetailRow {
  id: string;
  teaching_score: number;
  grading_score: number;
  attendance_score: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
  users: { name: string | null; email: string | null } | null;
  courses: { id: string; code: string | null; name: string } | null;
}

interface RawTeacherCourseRow {
  teacher_id: string;
  course_id: string;
}

interface RawCourseRow {
  id: string;
  code: string | null;
  name: string;
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function overallOf(r: { teaching_score: number; grading_score: number; attendance_score: number }): number {
  return (r.teaching_score + r.grading_score + r.attendance_score) / 3;
}

function isMissingSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /does not exist|column .* does not exist|relationship .* could not be found|schema cache/i.test(
    message,
  );
}

async function fetchCourseMapForTeachers(
  teacherIds: string[],
): Promise<Map<string, { id: string; code: string | null; name: string }[]>> {
  const coursesByTeacher = new Map<string, { id: string; code: string | null; name: string }[]>();
  if (teacherIds.length === 0) return coursesByTeacher;

  const { data: links, error: linksError } = await supabase
    .from('teacher_courses')
    .select('teacher_id, course_id')
    .in('teacher_id', teacherIds);
  if (linksError) {
    if (isMissingSchemaError(linksError)) return coursesByTeacher;
    throw linksError;
  }

  const rawLinks = (links ?? []) as RawTeacherCourseRow[];
  const courseIds = [...new Set(rawLinks.map((link) => link.course_id))];
  if (courseIds.length === 0) return coursesByTeacher;

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, code, name')
    .in('id', courseIds);
  if (coursesError) {
    if (isMissingSchemaError(coursesError)) return coursesByTeacher;
    throw coursesError;
  }

  const courseById = new Map(
    ((courses ?? []) as RawCourseRow[]).map((course) => [
      course.id,
      { id: course.id, code: course.code, name: course.name },
    ]),
  );

  for (const link of rawLinks) {
    const course = courseById.get(link.course_id);
    if (!course) continue;
    const list = coursesByTeacher.get(link.teacher_id) ?? [];
    list.push(course);
    coursesByTeacher.set(link.teacher_id, list);
  }

  return coursesByTeacher;
}

async function fetchApprovedReviewRows(teacherId: string): Promise<RawReviewDetailRow[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      'id, teaching_score, grading_score, attendance_score, comment, is_anonymous, created_at, users(name, email), courses(id, code, name)',
    )
    .eq('teacher_id', teacherId)
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (!error) return (data ?? []) as unknown as RawReviewDetailRow[];
  if (!isMissingSchemaError(error)) throw error;

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('reviews')
    .select(
      'id, teaching_score, grading_score, attendance_score, comment, is_anonymous, created_at, users(name, email)',
    )
    .eq('teacher_id', teacherId)
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (fallbackError) throw fallbackError;
  return ((fallbackData ?? []) as unknown as Omit<RawReviewDetailRow, 'courses'>[]).map((review) => ({
    ...review,
    courses: null,
  }));
}

export async function fetchTeachers(departmentId?: string, courseId?: string): Promise<TeacherListItem[]> {
  try {
    let query = supabase
      .from('teachers')
      .select('id, name, verification_status, departments(id, name)')
      .eq('university', 'NED')
      .order('name');
    if (departmentId) query = query.eq('department_id', departmentId);

    const { data: teacherRows, error: teacherError } = await query;
    if (teacherError) throw teacherError;

    const teachers = (teacherRows ?? []) as unknown as RawTeacherRow[];
    if (teachers.length === 0) return [];

    let scopedTeachers = teachers;
    if (courseId) {
      const { data: courseLinks, error: courseLinksError } = await supabase
        .from('teacher_courses')
        .select('teacher_id')
        .eq('course_id', courseId)
        .in('teacher_id', teachers.map((t) => t.id));
      if (courseLinksError) throw courseLinksError;
      const allowedTeacherIds = new Set(
        ((courseLinks ?? []) as Pick<RawTeacherCourseRow, 'teacher_id'>[]).map((link) => link.teacher_id),
      );
      scopedTeachers = teachers.filter((teacher) => allowedTeacherIds.has(teacher.id));
      if (scopedTeachers.length === 0) return [];
    }

    const { data: reviewRows, error: reviewError } = await supabase
      .from('reviews')
      .select('teacher_id, teaching_score, grading_score, attendance_score')
      .eq('approved', true)
      .in('teacher_id', scopedTeachers.map((t) => t.id));
    if (reviewError) throw reviewError;

    const coursesByTeacher = await fetchCourseMapForTeachers(scopedTeachers.map((t) => t.id));
    const scoresByTeacher = new Map<string, number[]>();
    for (const r of (reviewRows ?? []) as RawReviewAggRow[]) {
      const list = scoresByTeacher.get(r.teacher_id) ?? [];
      list.push(overallOf(r));
      scoresByTeacher.set(r.teacher_id, list);
    }

    return scopedTeachers.map((t) => {
      const scores = scoresByTeacher.get(t.id) ?? [];
      return {
        id: t.id,
        name: t.name,
        department: t.departments?.name ?? null,
        courses: coursesByTeacher.get(t.id) ?? [],
        verificationStatus: t.verification_status ?? 'unverified',
        rating: average(scores),
        reviewCount: scores.length,
      };
    });
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Public-safe subset of fetchTeacherById — name/department/courses only,
 *  no ratings or review text. Used by the public (server-rendered,
 *  indexable) teacher detail page so review content never ends up in the
 *  RSC payload sent to anonymous visitors/crawlers; the gated
 *  ReviewsSection client component calls the full fetchTeacherById itself,
 *  only after confirming the visitor is signed in. */
export async function fetchTeacherPublicById(
  id: string,
): Promise<Pick<TeacherDetail, 'id' | 'name' | 'department' | 'courses' | 'verificationStatus'>> {
  try {
    const { data: teacherRow, error: teacherError } = await supabase
      .from('teachers')
      .select('id, name, verification_status, departments(id, name)')
      .eq('id', id)
      .single();
    if (teacherError) throw teacherError;

    const teacher = teacherRow as unknown as RawTeacherRow;
    const coursesByTeacher = await fetchCourseMapForTeachers([id]);

    return {
      id: teacher.id,
      name: teacher.name,
      department: teacher.departments?.name ?? null,
      courses: coursesByTeacher.get(teacher.id) ?? [],
      verificationStatus: teacher.verification_status ?? 'unverified',
    };
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function fetchTeacherById(id: string): Promise<TeacherDetail> {
  try {
    const { data: teacherRow, error: teacherError } = await supabase
      .from('teachers')
      .select('id, name, verification_status, departments(id, name)')
      .eq('id', id)
      .single();
    if (teacherError) throw teacherError;

    const teacher = teacherRow as unknown as RawTeacherRow;
    const coursesByTeacher = await fetchCourseMapForTeachers([id]);

    const rawReviews = await fetchApprovedReviewRows(id);
    const reviews: TeacherReview[] = rawReviews.map((r) => ({
      id: r.id,
      author: r.is_anonymous
        ? 'Anonymous Student'
        : isAdminEmail(r.users?.email)
          ? 'Admin'
          : r.users?.name || 'Anonymous Student',
      course: r.courses,
      comment: r.comment,
      teaching: r.teaching_score,
      grading: r.grading_score,
      attendance: r.attendance_score,
      createdAt: new Date(r.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }));

    return {
      id: teacher.id,
      name: teacher.name,
      department: teacher.departments?.name ?? null,
      courses: coursesByTeacher.get(teacher.id) ?? [],
      verificationStatus: teacher.verification_status ?? 'unverified',
      rating: average(rawReviews.map(overallOf)),
      reviewCount: reviews.length,
      breakdown: reviews.length
        ? {
            teaching: average(reviews.map((r) => r.teaching)) ?? 0,
            grading: average(reviews.map((r) => r.grading)) ?? 0,
            attendance: average(reviews.map((r) => r.attendance)) ?? 0,
          }
        : null,
      reviews,
    };
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface SubmitReviewInput {
  teacherId: string;
  courseId?: string | null;
  userId: string;
  teachingScore: number;
  gradingScore: number;
  attendanceScore: number;
  comment: string;
  isAnonymous: boolean;
}

/** Inserts with approved: false — reviews go live only after moderation.
 *  Rejects once the user has already posted MAX_REVIEWS_PER_DAY reviews
 *  today, to keep one person from flooding a teacher's review list. */
export async function submitReview(input: SubmitReviewInput): Promise<void> {
  if (isReportReviewFunctionConfigured()) {
    return callReviewFunction<void>('submitReview', {
      teacherId: input.teacherId,
      courseId: input.courseId ?? null,
      teachingScore: input.teachingScore,
      gradingScore: input.gradingScore,
      attendanceScore: input.attendanceScore,
      comment: input.comment,
      isAnonymous: input.isAnonymous,
    });
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', input.userId)
      .gte('created_at', startOfToday.toISOString());
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_REVIEWS_PER_DAY) {
      throw new Error(
        `You've reached the daily limit of ${MAX_REVIEWS_PER_DAY} reviews. Please try again tomorrow.`,
      );
    }

    const cleanComment = sanitizeText(input.comment);
    const quality = analyzeReviewQuality(cleanComment);
    const duplicateSince = new Date();
    duplicateSince.setDate(duplicateSince.getDate() - 90);

    const { count: duplicateCount, error: duplicateError } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', input.userId)
      .eq('teacher_id', input.teacherId)
      .eq('review_fingerprint', quality.fingerprint)
      .gte('created_at', duplicateSince.toISOString());
    if (duplicateError) throw duplicateError;
    if ((duplicateCount ?? 0) > 0) {
      throw new Error('You already submitted a very similar review for this teacher recently.');
    }

    const reviewPayload: Record<string, unknown> = {
      teacher_id: input.teacherId,
      user_id: input.userId,
      teaching_score: input.teachingScore,
      grading_score: input.gradingScore,
      attendance_score: input.attendanceScore,
      comment: cleanComment,
      is_anonymous: input.isAnonymous,
      quality_flags: quality.flags,
      moderation_priority: quality.priority,
      review_fingerprint: quality.fingerprint,
      approved: false,
    };
    if (input.courseId) reviewPayload.course_id = input.courseId;

    const { error } = await supabase.from('reviews').insert(reviewPayload);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Flags a review for moderator attention. */
export async function reportReview(reviewId: string): Promise<void> {
  if (isReportReviewFunctionConfigured()) {
    return callReportReviewFunction(reviewId);
  }

  try {
    const { error } = await supabase
      .from('reviews')
      .update({ reported: true, moderation_priority: 100 })
      .eq('id', reviewId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface SuggestTeacherInput {
  userId: string;
  name: string;
  departmentId: string;
}

/** Inserts with approved: false — the suggestion appears in Admin → Teachers
 *  only, and only becomes a real teacher once an admin approves it (see
 *  src/features/admin/api.ts's approveTeacherSuggestion). */
export async function suggestTeacher(input: SuggestTeacherInput): Promise<void> {
  if (isCommunityFunctionConfigured()) {
    return callCommunityFunction<void>('submitTeacherSuggestion', {
      name: input.name,
      departmentId: input.departmentId,
    });
  }

  try {
    const { error } = await supabase.from('teacher_suggestions').insert({
      name: sanitizeText(input.name),
      department_id: input.departmentId,
      suggested_by: input.userId,
      approved: false,
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
