// Domain types shared by the Teachers feature's screens and components.
// Real data now comes from src/features/teachers/api.ts (Supabase) — see
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
  helpfulness: number;
  createdAt: string;
}

export interface TeacherDetail extends TeacherListItem {
  breakdown: { teaching: number; grading: number; attendance: number; helpfulness: number } | null;
  reviews: TeacherReview[];
  /** This viewer's own reviews for this teacher that are still awaiting
   *  moderator approval — empty when logged out or once approved. */
  myPendingReviews: TeacherReview[];
}

/** A single approved review surfaced outside its teacher's own page — e.g.
 *  the Home screen's "What students are saying" highlight. */
export interface RecentReview {
  id: string;
  author: string;
  teacherId: string;
  teacherName: string;
  comment: string;
  rating: number;
  createdAt: string;
}
