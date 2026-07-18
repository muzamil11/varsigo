-- Run this only after:
-- 1. supabase/functions/admin-action is deployed.
-- 2. Its secrets are set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
--    FIREBASE_API_KEY, ADMIN_PHONE.
-- 3. The app has EXPO_PUBLIC_ADMIN_FUNCTION_URL set to the deployed function URL.
--
-- This removes public anon access to admin mutations. The Edge Function keeps
-- working because it uses the service-role key server-side.

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

-- Keep user-facing MVP writes working for now. Move these behind Edge
-- Functions next if you want stricter production protection for all writes:
-- public insert reviews, public insert uploads, public insert suggestions,
-- public upsert users, public update own user row.

drop policy if exists "public update questions" on questions;
drop policy if exists "public delete questions" on questions;
drop policy if exists "public update answers" on answers;
drop policy if exists "public delete answers" on answers;
