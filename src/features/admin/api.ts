import { isAdminEmail } from '@/lib/admin';
import { callAdminFunction, isAdminFunctionConfigured } from '@/lib/adminFunction';
import { sanitizeText } from '@/lib/sanitize';
import { supabase, toFriendlyError } from '@/lib/supabase';
import type { PaperKind } from '@/features/papers/data';
import type {
  AdminDepartment,
  AdminCourse,
  AdminCommunityReport,
  AdminReview,
  AdminStats,
  AdminTeacher,
  AdminUpload,
  TeacherSuggestion,
} from './data';

/** Every function here is called with the caller's own email and re-checks
 *  it against EXPO_PUBLIC_ADMIN_EMAIL before touching the database — see
 *  src/lib/admin.ts for why this is a client-side gate, not a real security
 *  boundary. */
function assertAdmin(email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    throw new Error('Not authorized: admin access only.');
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isMissingSchemaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /does not exist|column .* does not exist|relationship .* could not be found|schema cache/i.test(
    message,
  );
}

interface RawPendingReviewRow {
  id: string;
  teaching_score: number;
  grading_score: number;
  attendance_score: number;
  helpfulness_score: number;
  comment: string | null;
  quality_flags: string[] | null;
  moderation_priority: number | null;
  reported: boolean | null;
  is_anonymous: boolean;
  created_at: string;
  teachers: { name: string } | null;
  courses: { code: string | null; name: string } | null;
  users: { email: string } | null;
}

function formatAdminCourse(course: { code: string | null; name: string }): string {
  return course.code ? `${course.code} - ${course.name}` : course.name;
}

export async function fetchPendingReviews(adminEmail: string): Promise<AdminReview[]> {
  assertAdmin(adminEmail);
  try {
    const primary = await supabase
      .from('reviews')
      .select(
        'id, teaching_score, grading_score, attendance_score, helpfulness_score, comment, quality_flags, moderation_priority, reported, is_anonymous, created_at, teachers(name), courses(code, name), users(email)',
      )
      .eq('approved', false)
      .order('reported', { ascending: false })
      .order('moderation_priority', { ascending: false })
      .order('created_at', { ascending: false });
    let data = primary.data as unknown[] | null;
    let error = primary.error;
    if (error && isMissingSchemaError(error)) {
      const fallback = await supabase
        .from('reviews')
        .select(
          'id, teaching_score, grading_score, attendance_score, helpfulness_score, comment, is_anonymous, created_at, teachers(name), users(email)',
        )
        .eq('approved', false)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;

    return ((data ?? []) as unknown as RawPendingReviewRow[]).map((r) => ({
      id: r.id,
      teacherName: r.teachers?.name ?? 'Unknown teacher',
      courseName: r.courses ? formatAdminCourse(r.courses) : null,
      teachingScore: r.teaching_score,
      gradingScore: r.grading_score,
      attendanceScore: r.attendance_score,
      helpfulnessScore: r.helpfulness_score,
      comment: r.comment,
      qualityFlags: r.quality_flags ?? [],
      moderationPriority: r.moderation_priority ?? 0,
      reported: Boolean(r.reported),
      submittedBy: r.is_anonymous ? 'Anonymous' : (r.users?.email ?? 'Anonymous'),
      createdAt: formatDate(r.created_at),
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function approveReview(adminEmail: string, reviewId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('approveReview', { reviewId });
  }
  try {
    const { error } = await supabase.from('reviews').update({ approved: true }).eq('id', reviewId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function rejectReview(adminEmail: string, reviewId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('rejectReview', { reviewId });
  }
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

interface RawPendingUploadRow {
  id: string;
  title: string;
  subject: string;
  department_id: string | null;
  year: number | null;
  type: PaperKind;
  file_url: string;
  file_urls: string[] | null;
  created_at: string;
  departments: { name: string } | null;
}

const UPLOAD_COLUMNS =
  'id, title, subject, department_id, year, type, file_url, file_urls, created_at, departments(name)';

function mapAdminUpload(u: RawPendingUploadRow): AdminUpload {
  return {
    id: u.id,
    title: u.title,
    subject: u.subject,
    departmentId: u.department_id,
    department: u.departments?.name ?? null,
    year: u.year,
    kind: u.type,
    fileUrl: u.file_url,
    fileUrls: u.file_urls?.length ? u.file_urls : [u.file_url],
    createdAt: formatDate(u.created_at),
  };
}

export async function fetchPendingUploads(adminEmail: string): Promise<AdminUpload[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select(UPLOAD_COLUMNS)
      .eq('approved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ((data ?? []) as unknown as RawPendingUploadRow[]).map(mapAdminUpload);
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Already-published papers (approved: true) — lets the admin edit/remove a
 *  live paper later, separate from the moderation queue above. */
export async function fetchApprovedUploads(adminEmail: string): Promise<AdminUpload[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select(UPLOAD_COLUMNS)
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ((data ?? []) as unknown as RawPendingUploadRow[]).map(mapAdminUpload);
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function approveUpload(adminEmail: string, uploadId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('approveUpload', { uploadId });
  }
  try {
    const { error } = await supabase.from('uploads').update({ approved: true }).eq('id', uploadId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function rejectUpload(adminEmail: string, uploadId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('rejectUpload', { uploadId });
  }
  try {
    const { error } = await supabase.from('uploads').delete().eq('id', uploadId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface UpdateUploadInput {
  title: string;
  subject: string;
  departmentId: string | null;
  year: number | null;
  kind: PaperKind;
}

/** Edits a paper's metadata — works on a pending OR already-published
 *  upload alike (no `approved` filter), same as rejectUpload above. */
export async function updateUpload(
  adminEmail: string,
  uploadId: string,
  input: UpdateUploadInput,
): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('updateUpload', { uploadId, ...input });
  }
  try {
    const { error } = await supabase
      .from('uploads')
      .update({
        title: sanitizeText(input.title),
        subject: sanitizeText(input.subject),
        department_id: input.departmentId,
        year: input.year,
        type: input.kind,
      })
      .eq('id', uploadId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function fetchAdminStats(adminEmail: string): Promise<AdminStats> {
  assertAdmin(adminEmail);
  try {
    const [
      departments,
      teachers,
      courses,
      approvedReviews,
      approvedUploads,
      pendingReviews,
      pendingUploads,
      pendingSuggestions,
    ] = await Promise.all([
        supabase
          .from('departments')
          .select('id', { count: 'exact', head: true })
          .eq('university', 'NED'),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', true),
        supabase.from('uploads').select('id', { count: 'exact', head: true }).eq('approved', true),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('uploads').select('id', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('teacher_suggestions').select('id', { count: 'exact', head: true }).eq('approved', false),
      ]);

    for (const result of [
      departments,
      teachers,
      approvedReviews,
      approvedUploads,
      pendingReviews,
      pendingUploads,
      pendingSuggestions,
    ]) {
      if (result.error) throw result.error;
    }
    if (courses.error && !isMissingSchemaError(courses.error)) {
      throw courses.error;
    }

    const [reportedQuestions, reportedAnswers] = await Promise.all([
      supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('reported', true)
        .eq('status', 'active'),
      supabase
        .from('answers')
        .select('id', { count: 'exact', head: true })
        .eq('reported', true)
        .eq('status', 'active'),
    ]);
    const communityReports =
      (reportedQuestions.error && isMissingSchemaError(reportedQuestions.error)
        ? 0
        : reportedQuestions.count ?? 0) +
      (reportedAnswers.error && isMissingSchemaError(reportedAnswers.error)
        ? 0
        : reportedAnswers.count ?? 0);
    if (reportedQuestions.error && !isMissingSchemaError(reportedQuestions.error)) {
      throw reportedQuestions.error;
    }
    if (reportedAnswers.error && !isMissingSchemaError(reportedAnswers.error)) {
      throw reportedAnswers.error;
    }

    return {
      totalDepartments: departments.count ?? 0,
      totalTeachers: teachers.count ?? 0,
      totalCourses:
        courses.error && isMissingSchemaError(courses.error) ? 0 : courses.count ?? 0,
      approvedReviews: approvedReviews.count ?? 0,
      approvedUploads: approvedUploads.count ?? 0,
      pendingReviews: pendingReviews.count ?? 0,
      pendingUploads: pendingUploads.count ?? 0,
      pendingTeacherSuggestions: pendingSuggestions.count ?? 0,
      pendingCommunityReports: communityReports,
    };
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

interface RawReportedQuestionRow {
  id: string;
  title: string;
  body: string | null;
  reported_count: number | null;
  moderation_priority: number | null;
  created_at: string;
}

interface RawReportedAnswerRow {
  id: string;
  body: string;
  reported_count: number | null;
  moderation_priority: number | null;
  created_at: string;
  questions: { title: string } | null;
}

export async function fetchReportedCommunity(adminEmail: string): Promise<AdminCommunityReport[]> {
  assertAdmin(adminEmail);
  try {
    const [questions, answers] = await Promise.all([
      supabase
        .from('questions')
        .select('id, title, body, reported_count, moderation_priority, created_at')
        .eq('reported', true)
        .eq('status', 'active')
        .order('moderation_priority', { ascending: false }),
      supabase
        .from('answers')
        .select(
          'id, body, reported_count, moderation_priority, created_at, questions!answers_question_id_fkey(title)',
        )
        .eq('reported', true)
        .eq('status', 'active')
        .order('moderation_priority', { ascending: false }),
    ]);
    if (questions.error && isMissingSchemaError(questions.error)) return [];
    if (answers.error && isMissingSchemaError(answers.error)) return [];
    if (questions.error) throw questions.error;
    if (answers.error) throw answers.error;

    return [
      ...((questions.data ?? []) as RawReportedQuestionRow[]).map((item) => ({
        id: item.id,
        kind: 'question' as const,
        title: item.title,
        body: item.body ?? '',
        reportedCount: item.reported_count ?? 0,
        moderationPriority: item.moderation_priority ?? 0,
        createdAt: formatDate(item.created_at),
      })),
      ...((answers.data ?? []) as unknown as RawReportedAnswerRow[]).map((item) => ({
        id: item.id,
        kind: 'answer' as const,
        title: item.questions?.title ?? 'Answer',
        body: item.body,
        reportedCount: item.reported_count ?? 0,
        moderationPriority: item.moderation_priority ?? 0,
        createdAt: formatDate(item.created_at),
      })),
    ].sort((a, b) => b.moderationPriority - a.moderationPriority);
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function dismissCommunityReport(
  adminEmail: string,
  report: AdminCommunityReport,
): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('dismissCommunityReport', { report });
  }
  try {
    const table = report.kind === 'question' ? 'questions' : 'answers';
    const { error } = await supabase
      .from(table)
      .update({ reported: false, reported_count: 0, moderation_priority: 0 })
      .eq('id', report.id);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function hideCommunityItem(
  adminEmail: string,
  report: AdminCommunityReport,
): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('hideCommunityItem', { report });
  }
  try {
    const table = report.kind === 'question' ? 'questions' : 'answers';
    const { error } = await supabase.from(table).update({ status: 'hidden' }).eq('id', report.id);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function fetchAdminDepartments(adminEmail: string): Promise<AdminDepartment[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('university', 'NED')
      .order('name');
    if (error) throw error;

    return ((data ?? []) as AdminDepartment[]).map((d) => ({ id: d.id, name: d.name }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function addDepartment(adminEmail: string, name: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('addDepartment', { name: sanitizeText(name) });
  }
  try {
    const { error } = await supabase.from('departments').insert({
      name: sanitizeText(name),
      university: 'NED',
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function deleteDepartment(adminEmail: string, departmentId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('deleteDepartment', { departmentId });
  }
  try {
    const { error } = await supabase.from('departments').delete().eq('id', departmentId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

interface RawAdminTeacherRow {
  id: string;
  name: string;
  verification_status: AdminTeacher['verificationStatus'] | null;
  departments: { name: string } | null;
}

interface RawAdminTeacherCourseRow {
  teacher_id: string;
  course_id: string;
}

interface RawAdminCourseRow {
  id: string;
  code: string | null;
  name: string;
  department_id: string | null;
  departments: { name: string } | null;
}

async function fetchAdminCourseMap(
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

  const rawLinks = (links ?? []) as RawAdminTeacherCourseRow[];
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
    ((courses ?? []) as Pick<RawAdminCourseRow, 'id' | 'code' | 'name'>[]).map((course) => [
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

export async function fetchAdminTeachers(adminEmail: string): Promise<AdminTeacher[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, verification_status, departments(name)')
      .order('name');
    if (error) throw error;

    const teachers = (data ?? []) as unknown as RawAdminTeacherRow[];
    const coursesByTeacher = await fetchAdminCourseMap(teachers.map((t) => t.id));

    return teachers.map((t) => ({
      id: t.id,
      name: t.name,
      department: t.departments?.name ?? null,
      courses: coursesByTeacher.get(t.id) ?? [],
      verificationStatus: t.verification_status ?? 'unverified',
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface AddTeacherInput {
  adminEmail: string;
  name: string;
  departmentId: string;
  courseIds?: string[];
}

export async function addTeacher(input: AddTeacherInput): Promise<void> {
  assertAdmin(input.adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('addTeacher', {
      name: sanitizeText(input.name),
      departmentId: input.departmentId,
      courseIds: input.courseIds ?? [],
    });
  }
  try {
    const { data, error } = await supabase
      .from('teachers')
      .insert({
      name: sanitizeText(input.name),
      department_id: input.departmentId,
      university: 'NED',
      verification_status: 'admin_verified',
      verified_at: new Date().toISOString(),
    })
      .select('id')
      .single();
    if (error) throw error;

    const courseIds = input.courseIds ?? [];
    if (courseIds.length > 0) {
      const { error: linkError } = await supabase.from('teacher_courses').insert(
        courseIds.map((courseId) => ({
          teacher_id: (data as { id: string }).id,
          course_id: courseId,
        })),
      );
      if (linkError) throw linkError;
    }
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function fetchAdminCourses(adminEmail: string): Promise<AdminCourse[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, name, department_id, departments(name)')
      .eq('university', 'NED')
      .order('name');
    if (error) {
      if (isMissingSchemaError(error)) return [];
      throw error;
    }

    return ((data ?? []) as unknown as RawAdminCourseRow[]).map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      departmentId: course.department_id,
      department: course.departments?.name ?? null,
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export interface AddCourseInput {
  adminEmail: string;
  name: string;
  code?: string;
  departmentId: string;
}

export async function addCourse(input: AddCourseInput): Promise<void> {
  assertAdmin(input.adminEmail);
  const payload = {
    name: sanitizeText(input.name),
    code: input.code ? sanitizeText(input.code).toUpperCase() : null,
    departmentId: input.departmentId,
  };
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('addCourse', payload);
  }
  try {
    const { error } = await supabase.from('courses').insert({
      name: payload.name,
      code: payload.code,
      department_id: payload.departmentId,
      university: 'NED',
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function deleteCourse(adminEmail: string, courseId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('deleteCourse', { courseId });
  }
  try {
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function assignTeacherCourse(
  adminEmail: string,
  teacherId: string,
  courseId: string,
): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('assignTeacherCourse', { teacherId, courseId });
  }
  try {
    const { error } = await supabase
      .from('teacher_courses')
      .upsert({ teacher_id: teacherId, course_id: courseId }, { onConflict: 'teacher_id,course_id' });
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** Deletes the teacher along with their reviews (see schema.sql's ON DELETE
 *  CASCADE on reviews.teacher_id — plain deletion would otherwise fail for
 *  any teacher who already has reviews). */
export async function deleteTeacher(adminEmail: string, teacherId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('deleteTeacher', { teacherId });
  }
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

interface RawSuggestionRow {
  id: string;
  name: string;
  department_id: string | null;
  created_at: string;
  departments: { name: string } | null;
  users: { email: string } | null;
}

export async function fetchPendingTeacherSuggestions(adminEmail: string): Promise<TeacherSuggestion[]> {
  assertAdmin(adminEmail);
  try {
    const { data, error } = await supabase
      .from('teacher_suggestions')
      .select('id, name, department_id, created_at, departments(name), users(email)')
      .eq('approved', false)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return ((data ?? []) as unknown as RawSuggestionRow[]).map((s) => ({
      id: s.id,
      name: s.name,
      departmentId: s.department_id,
      departmentName: s.departments?.name ?? null,
      suggestedBy: s.users?.email ?? 'Unknown',
      createdAt: formatDate(s.created_at),
    }));
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

/** "Moves" a suggestion into the teachers table: inserts it there, then
 *  deletes the suggestion row (teacher_suggestions has no approved-flag
 *  read path in the app, unlike reviews/uploads, so there's nothing to gain
 *  from leaving an approved row behind). */
export async function approveTeacherSuggestion(
  adminEmail: string,
  suggestion: TeacherSuggestion,
): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('approveTeacherSuggestion', { suggestion });
  }
  try {
    if (!suggestion.departmentId) {
      throw new Error('This suggestion has no department set.');
    }

    const { error: insertError } = await supabase.from('teachers').insert({
      name: suggestion.name,
      department_id: suggestion.departmentId,
      university: 'NED',
      verification_status: 'suggestion_approved',
      verified_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;

    const { error: deleteError } = await supabase
      .from('teacher_suggestions')
      .delete()
      .eq('id', suggestion.id);
    if (deleteError) throw deleteError;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}

export async function rejectTeacherSuggestion(adminEmail: string, suggestionId: string): Promise<void> {
  assertAdmin(adminEmail);
  if (isAdminFunctionConfigured()) {
    return callAdminFunction<void>('rejectTeacherSuggestion', { suggestionId });
  }
  try {
    const { error } = await supabase.from('teacher_suggestions').delete().eq('id', suggestionId);
    if (error) throw error;
  } catch (error) {
    throw new Error(toFriendlyError(error));
  }
}
