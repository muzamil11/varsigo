// Hand-written to match supabase/schema.sql (same Supabase project as the
// Expo app — see /home/user/varsigo/src/lib/database.types.ts, the source of
// truth this file is kept in sync with).
//
// Deliberately NOT wired into `createClient<Database>()` — the installed
// @supabase/supabase-js resolves the schema-name generic through an
// internal `__InternalSupabase: { PostgrestVersion }` marker that only
// `supabase gen types` output includes, and a hand-written Database type
// without it silently collapses every table's Row/Insert type to `never`.
// Instead, the plain (untyped-schema) client is used, and each api.ts module
// annotates return values with the Row types below.

export interface UserRow {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  university: string;
  created_at: string;
}

export interface DepartmentRow {
  id: string;
  name: string;
  university: string;
}

export interface TeacherRow {
  id: string;
  name: string;
  department_id: string | null;
  university: string;
  verification_status: 'admin_verified' | 'suggestion_approved' | 'unverified';
  verified_at: string | null;
}

export interface CourseRow {
  id: string;
  code: string | null;
  name: string;
  department_id: string | null;
  university: string;
  created_at: string;
}

export interface TeacherCourseRow {
  id: string;
  teacher_id: string;
  course_id: string;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  teacher_id: string;
  course_id: string | null;
  user_id: string | null;
  grading_score: number;
  attendance_score: number;
  teaching_score: number;
  comment: string | null;
  is_anonymous: boolean;
  approved: boolean;
  reported: boolean;
  reported_count: number;
  quality_flags: string[];
  moderation_priority: number;
  review_fingerprint: string | null;
  created_at: string;
}

export interface UploadRow {
  id: string;
  user_id: string | null;
  title: string;
  subject: string;
  department_id: string | null;
  year: number | null;
  type: 'past_paper' | 'notes';
  file_url: string;
  file_urls: string[] | null;
  approved: boolean;
  created_at: string;
}

export interface TeacherSuggestionRow {
  id: string;
  name: string;
  department_id: string | null;
  suggested_by: string | null;
  approved: boolean;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  user_id: string | null;
  title: string;
  body: string | null;
  department_id: string | null;
  is_anonymous: boolean;
  status: 'active' | 'hidden' | 'deleted';
  accepted_answer_id: string | null;
  upvote_count: number;
  answer_count: number;
  reported: boolean;
  reported_count: number;
  quality_flags: string[];
  moderation_priority: number;
  created_at: string;
}

export interface AnswerRow {
  id: string;
  question_id: string;
  user_id: string | null;
  body: string;
  is_anonymous: boolean;
  status: 'active' | 'hidden' | 'deleted';
  upvote_count: number;
  reported: boolean;
  reported_count: number;
  quality_flags: string[];
  moderation_priority: number;
  created_at: string;
}
