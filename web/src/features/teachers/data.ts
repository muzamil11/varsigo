// Domain types shared by the Teachers feature's pages and components. Real
// data comes from src/features/teachers/api.ts (Supabase) — see
// supabase/schema.sql for the underlying tables.

export interface TeacherListItem {
  id: string;
  name: string;
  department: string | null;
  courses: { id: string; code: string | null; name: string }[];
  verificationStatus: 'admin_verified' | 'suggestion_approved' | 'unverified';
  rating: number | null; // null = no approved reviews yet
  reviewCount: number;
}

export interface TeacherReview {
  id: string;
  author: string; // "Anonymous" or the reviewer's name
  course: { id: string; code: string | null; name: string } | null;
  comment: string | null;
  teaching: number;
  grading: number;
  attendance: number;
  createdAt: string;
}

export interface TeacherDetail extends TeacherListItem {
  breakdown: { teaching: number; grading: number; attendance: number } | null;
  reviews: TeacherReview[];
}
