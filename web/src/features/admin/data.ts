// Domain types for the Admin portal's moderation pages. Real data comes
// from src/features/admin/api.ts (Supabase "reviews"/"uploads"/"teachers"
// tables).

import type { PaperKind } from '@/features/papers/data';

export interface AdminReview {
  id: string;
  teacherName: string;
  courseName: string | null;
  teachingScore: number;
  gradingScore: number;
  attendanceScore: number;
  comment: string | null;
  qualityFlags: string[];
  moderationPriority: number;
  reported: boolean;
  submittedBy: string;
  createdAt: string;
}

export interface AdminUpload {
  id: string;
  title: string;
  subject: string;
  departmentId: string | null;
  department: string | null;
  year: number | null;
  kind: PaperKind;
  fileUrl: string;
  fileUrls: string[];
  createdAt: string;
}

export interface AdminStats {
  totalDepartments: number;
  totalTeachers: number;
  totalCourses: number;
  approvedReviews: number;
  approvedUploads: number;
  pendingReviews: number;
  pendingUploads: number;
  pendingTeacherSuggestions: number;
  pendingCommunityReports: number;
}

export interface AdminTeacher {
  id: string;
  name: string;
  departmentId: string | null;
  department: string | null;
  courses: { id: string; code: string | null; name: string }[];
  verificationStatus: 'admin_verified' | 'suggestion_approved' | 'unverified';
}

export interface AdminDepartment {
  id: string;
  name: string;
}

export interface AdminCourse {
  id: string;
  code: string | null;
  name: string;
  departmentId: string | null;
  department: string | null;
}

export interface TeacherSuggestion {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  suggestedBy: string;
  createdAt: string;
}

export interface AdminCommunityReport {
  id: string;
  kind: 'question' | 'answer';
  title: string;
  body: string;
  reportedCount: number;
  moderationPriority: number;
  createdAt: string;
}
