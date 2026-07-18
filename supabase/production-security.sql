-- Run this only after:
-- 1. supabase/functions/admin-action, community-action, and report-review are deployed.
-- 2. Their secrets are set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
--    FIREBASE_API_KEY, and ADMIN_PHONE for admin-action.
-- 3. The app has EXPO_PUBLIC_ADMIN_FUNCTION_URL,
--    EXPO_PUBLIC_COMMUNITY_FUNCTION_URL, and
--    EXPO_PUBLIC_REPORT_REVIEW_FUNCTION_URL set.
--
-- This removes public anon access to writes that now go through Edge
-- Functions. The functions keep working because they use the service-role key
-- server-side after verifying the Firebase ID token.

drop policy if exists "public update reviews" on reviews;
drop policy if exists "public delete reviews" on reviews;
drop policy if exists "public update uploads" on uploads;
drop policy if exists "public delete uploads" on uploads;
drop policy if exists "public insert teachers" on teachers;
drop policy if exists "public delete teachers" on teachers;
drop policy if exists "public insert departments" on departments;
drop policy if exists "public delete departments" on departments;
drop policy if exists "public insert courses" on courses;
drop policy if exists "public delete courses" on courses;
drop policy if exists "public insert teacher courses" on teacher_courses;
drop policy if exists "public delete teacher courses" on teacher_courses;
drop policy if exists "public delete suggestions" on teacher_suggestions;
drop policy if exists "public insert suggestions" on teacher_suggestions;
drop policy if exists "public insert reviews" on reviews;
drop policy if exists "public insert uploads" on uploads;
drop policy if exists "public insert questions" on questions;
drop policy if exists "public insert answers" on answers;
drop policy if exists "public update questions" on questions;
drop policy if exists "public update answers" on answers;
drop policy if exists "public upsert users" on users;
drop policy if exists "public update own user row" on users;

-- Keep public user reads for embedded author/profile display. Profile writes
-- now go through community-action after Firebase token verification.

drop policy if exists "public delete questions" on questions;
drop policy if exists "public delete answers" on answers;
