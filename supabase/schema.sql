-- Varsigo — Supabase schema
-- Run this once in your project's SQL Editor (https://supabase.com/dashboard → SQL Editor → New query).
-- Safe to re-run: every statement is idempotent (create-if-not-exists / drop-if-exists).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text not null,
  name text,
  university text default 'NED',
  created_at timestamptz default now()
);

-- Migrated from Firebase phone-OTP identity (phone) to Google Sign-In
-- (firebase_uid + email). No production users existed at migration time, so
-- existing rows are cleared rather than backfilled — safe to re-run.
delete from users;
alter table users drop column if exists phone;
alter table users add column if not exists firebase_uid text;
alter table users add column if not exists email text;
alter table users alter column firebase_uid set not null;
alter table users alter column email set not null;
create unique index if not exists idx_users_firebase_uid on users(firebase_uid);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  university text default 'NED'
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references departments(id),
  university text default 'NED',
  verification_status text default 'admin_verified'
    check (verification_status in ('admin_verified', 'suggestion_approved', 'unverified')),
  verified_at timestamptz default now()
);

alter table teachers add column if not exists verification_status text default 'admin_verified'
  check (verification_status in ('admin_verified', 'suggestion_approved', 'unverified'));
alter table teachers add column if not exists verified_at timestamptz default now();

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  department_id uuid references departments(id),
  university text default 'NED',
  created_at timestamptz default now()
);

create table if not exists teacher_courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  created_at timestamptz default now(),
  unique(teacher_id, course_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id),
  user_id uuid references users(id),
  grading_score int check (grading_score between 1 and 5),
  attendance_score int check (attendance_score between 1 and 5),
  teaching_score int check (teaching_score between 1 and 5),
  comment text,
  is_anonymous boolean default true,
  approved boolean default false,
  reported boolean default false,
  reported_count int default 0,
  quality_flags text[] default '{}',
  moderation_priority int default 0,
  review_fingerprint text,
  created_at timestamptz default now()
);

-- Added after the table's initial release — `create table if not exists`
-- above won't retrofit this column onto an already-existing table, so this
-- covers re-running the script against a live project.
alter table reviews add column if not exists reported boolean default false;
alter table reviews add column if not exists reported_count int default 0;
alter table reviews add column if not exists quality_flags text[] default '{}';
alter table reviews add column if not exists moderation_priority int default 0;
alter table reviews add column if not exists review_fingerprint text;

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  subject text not null,
  department_id uuid references departments(id),
  year int,
  type text check (type in ('past_paper', 'notes')),
  file_url text not null,
  file_urls text[] default '{}',
  approved boolean default false,
  created_at timestamptz default now()
);

alter table uploads add column if not exists file_urls text[] default '{}';

create table if not exists teacher_suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references departments(id),
  suggested_by uuid references users(id),
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  title text not null,
  body text,
  department_id uuid references departments(id),
  is_anonymous boolean default true,
  status text default 'active' check (status in ('active', 'hidden', 'deleted')),
  accepted_answer_id uuid,
  upvote_count int default 0,
  answer_count int default 0,
  reported boolean default false,
  reported_count int default 0,
  quality_flags text[] default '{}',
  moderation_priority int default 0,
  created_at timestamptz default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  user_id uuid references users(id),
  body text not null,
  is_anonymous boolean default true,
  status text default 'active' check (status in ('active', 'hidden', 'deleted')),
  upvote_count int default 0,
  reported boolean default false,
  reported_count int default 0,
  quality_flags text[] default '{}',
  moderation_priority int default 0,
  created_at timestamptz default now()
);

create table if not exists question_votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(question_id, user_id)
);

create table if not exists answer_votes (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid references answers(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(answer_id, user_id)
);

create table if not exists question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(question_id, user_id)
);

create table if not exists answer_reports (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid references answers(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(answer_id, user_id)
);

alter table questions add column if not exists accepted_answer_id uuid;
alter table questions drop constraint if exists questions_accepted_answer_id_fkey;
alter table questions add constraint questions_accepted_answer_id_fkey
  foreign key (accepted_answer_id) references answers(id) on delete set null;

-- Helpful indexes for the app's common queries.
create index if not exists idx_teachers_department_id on teachers(department_id);
create index if not exists idx_courses_department_id on courses(department_id);
create index if not exists idx_teacher_courses_teacher_id on teacher_courses(teacher_id);
create index if not exists idx_teacher_courses_course_id on teacher_courses(course_id);
create index if not exists idx_reviews_teacher_id on reviews(teacher_id);
create index if not exists idx_reviews_approved on reviews(approved);
create index if not exists idx_reviews_moderation_priority on reviews(moderation_priority desc);
create index if not exists idx_reviews_review_fingerprint on reviews(review_fingerprint);
create index if not exists idx_uploads_department_id on uploads(department_id);
create index if not exists idx_uploads_approved on uploads(approved);
create index if not exists idx_teacher_suggestions_approved on teacher_suggestions(approved);
create index if not exists idx_questions_status_created_at on questions(status, created_at desc);
create index if not exists idx_questions_department_id on questions(department_id);
create index if not exists idx_questions_moderation_priority on questions(moderation_priority desc);
create index if not exists idx_answers_question_id on answers(question_id);
create index if not exists idx_answers_status_created_at on answers(status, created_at desc);
create index if not exists idx_answers_moderation_priority on answers(moderation_priority desc);
create index if not exists idx_question_votes_user_id on question_votes(user_id);
create index if not exists idx_answer_votes_user_id on answer_votes(user_id);
create index if not exists idx_question_reports_user_id on question_reports(user_id);
create index if not exists idx_answer_reports_user_id on answer_reports(user_id);

-- Uniqueness the seed script's upsert() relies on to stay idempotent (match
-- on these columns instead of inserting duplicates every run).
create unique index if not exists idx_departments_name_university on departments(name, university);
create unique index if not exists idx_teachers_name_department on teachers(name, department_id);
create unique index if not exists idx_courses_code_department
  on courses(coalesce(code, ''), department_id);
create unique index if not exists idx_courses_name_department on courses(name, department_id);

-- Admin's "delete teacher" (see src/features/admin/api.ts's deleteTeacher)
-- needs this: the plain `references teachers(id)` above defaults to NO
-- ACTION, which would block deleting any teacher who already has reviews.
-- Re-adding the constraint with ON DELETE CASCADE lets that delete succeed
-- and take the teacher's reviews with it. Safe to re-run (drop + re-add).
alter table reviews drop constraint if exists reviews_teacher_id_fkey;
alter table reviews add constraint reviews_teacher_id_fkey
  foreign key (teacher_id) references teachers(id) on delete cascade;

-- Admin can now manage departments in-app. Deleting a department should not
-- delete teacher/review/upload history, so dependent rows keep working with a
-- null department_id after the department is removed.
alter table teachers drop constraint if exists teachers_department_id_fkey;
alter table teachers add constraint teachers_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

alter table uploads drop constraint if exists uploads_department_id_fkey;
alter table uploads add constraint uploads_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

alter table teacher_suggestions drop constraint if exists teacher_suggestions_department_id_fkey;
alter table teacher_suggestions add constraint teacher_suggestions_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

alter table courses drop constraint if exists courses_department_id_fkey;
alter table courses add constraint courses_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

-- Account deletion keeps community content but removes the user link. Reviews
-- remain anonymous, uploads remain visible after approval, and pending teacher
-- suggestions lose their suggested_by reference.
alter table reviews drop constraint if exists reviews_user_id_fkey;
alter table reviews add constraint reviews_user_id_fkey
  foreign key (user_id) references users(id) on delete set null;

alter table uploads drop constraint if exists uploads_user_id_fkey;
alter table uploads add constraint uploads_user_id_fkey
  foreign key (user_id) references users(id) on delete set null;

alter table teacher_suggestions drop constraint if exists teacher_suggestions_suggested_by_fkey;
alter table teacher_suggestions add constraint teacher_suggestions_suggested_by_fkey
  foreign key (suggested_by) references users(id) on delete set null;

alter table questions drop constraint if exists questions_user_id_fkey;
alter table questions add constraint questions_user_id_fkey
  foreign key (user_id) references users(id) on delete set null;

alter table answers drop constraint if exists answers_user_id_fkey;
alter table answers add constraint answers_user_id_fkey
  foreign key (user_id) references users(id) on delete set null;

alter table questions drop constraint if exists questions_department_id_fkey;
alter table questions add constraint questions_department_id_fkey
  foreign key (department_id) references departments(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- IMPORTANT: this app authenticates users via Firebase (Google Sign-In), not
-- Supabase Auth — so there is no `auth.uid()` to key policies off of. The
-- Supabase client connects with the public anon key. The policies below are
-- deliberately permissive (anon can read/insert) so the MVP works end to end.
-- Before shipping to real users, move writes behind a server (Edge Function
-- with the service role key) that verifies the Firebase ID token, instead of
-- trusting the client directly.
-- ─────────────────────────────────────────────────────────────────────────

alter table users enable row level security;
alter table departments enable row level security;
alter table teachers enable row level security;
alter table courses enable row level security;
alter table teacher_courses enable row level security;
alter table reviews enable row level security;
alter table uploads enable row level security;
alter table teacher_suggestions enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table question_votes enable row level security;
alter table answer_votes enable row level security;
alter table question_reports enable row level security;
alter table answer_reports enable row level security;

drop policy if exists "public read departments" on departments;
create policy "public read departments" on departments for select using (true);

drop policy if exists "public insert departments" on departments;
create policy "public insert departments" on departments for insert with check (true);

drop policy if exists "public delete departments" on departments;
create policy "public delete departments" on departments for delete using (true);

drop policy if exists "public read teachers" on teachers;
create policy "public read teachers" on teachers for select using (true);

drop policy if exists "public read courses" on courses;
create policy "public read courses" on courses for select using (true);

drop policy if exists "public read teacher courses" on teacher_courses;
create policy "public read teacher courses" on teacher_courses for select using (true);

drop policy if exists "public read approved reviews" on reviews;
create policy "public read approved reviews" on reviews for select using (approved = true);

drop policy if exists "public insert reviews" on reviews;
create policy "public insert reviews" on reviews for insert with check (true);

drop policy if exists "public read approved uploads" on uploads;
create policy "public read approved uploads" on uploads for select using (approved = true);

drop policy if exists "public insert uploads" on uploads;
create policy "public insert uploads" on uploads for insert with check (true);

-- users: the app upserts a row keyed by firebase_uid right after Firebase
-- verifies the Google sign-in, and later reads/writes its own row by id.
-- Anon can upsert/select; there's no per-row auth.uid() check available
-- (see note above).
drop policy if exists "public upsert users" on users;
create policy "public upsert users" on users for insert with check (true);

drop policy if exists "public update own user row" on users;
create policy "public update own user row" on users for update using (true);

drop policy if exists "public read users" on users;
create policy "public read users" on users for select using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Admin moderation (in-app Admin tab — see src/app/(tabs)/admin.tsx)
--
-- The moderation screens need to read pending (approved = false) rows and
-- approve/reject them. There's still no auth.uid() to key a real "is this
-- request from the admin" policy off of (same limitation as above), so this
-- is intentionally as permissive as the rest of the MVP's RLS — the actual
-- gate is the client-side email check (src/lib/admin.ts's isAdminEmail(),
-- used by authStore.isAdmin() and every src/features/admin/api.ts call).
-- Before this app has real users, move moderation behind a server that
-- verifies the Firebase ID token and the admin email.
-- ─────────────────────────────────────────────────────────────────────────

drop policy if exists "public read all reviews" on reviews;
create policy "public read all reviews" on reviews for select using (true);

drop policy if exists "public update reviews" on reviews;
create policy "public update reviews" on reviews for update using (true) with check (true);

drop policy if exists "public delete reviews" on reviews;
create policy "public delete reviews" on reviews for delete using (true);

drop policy if exists "public read all uploads" on uploads;
create policy "public read all uploads" on uploads for select using (true);

drop policy if exists "public update uploads" on uploads;
create policy "public update uploads" on uploads for update using (true) with check (true);

drop policy if exists "public delete uploads" on uploads;
create policy "public delete uploads" on uploads for delete using (true);

-- teachers: "public read teachers" above already covers browsing; admin
-- add/delete (src/app/(tabs)/admin.tsx's Teachers segment) also needs
-- insert/delete, gated client-side the same way as everything else here.
drop policy if exists "public insert teachers" on teachers;
create policy "public insert teachers" on teachers for insert with check (true);

drop policy if exists "public delete teachers" on teachers;
create policy "public delete teachers" on teachers for delete using (true);

drop policy if exists "public insert courses" on courses;
create policy "public insert courses" on courses for insert with check (true);

drop policy if exists "public delete courses" on courses;
create policy "public delete courses" on courses for delete using (true);

drop policy if exists "public insert teacher courses" on teacher_courses;
create policy "public insert teacher courses" on teacher_courses for insert with check (true);

drop policy if exists "public delete teacher courses" on teacher_courses;
create policy "public delete teacher courses" on teacher_courses for delete using (true);

-- teacher_suggestions: any user can suggest (see src/features/teachers/api.ts's
-- suggestTeacher) and read the list; admin approval "moves" a row to
-- teachers via insert-then-delete (see approveTeacherSuggestion) rather than
-- an update, so no update policy is needed here.
drop policy if exists "public insert suggestions" on teacher_suggestions;
create policy "public insert suggestions" on teacher_suggestions
  for insert with check (true);

drop policy if exists "public read suggestions" on teacher_suggestions;
create policy "public read suggestions" on teacher_suggestions
  for select using (true);

drop policy if exists "public delete suggestions" on teacher_suggestions;
create policy "public delete suggestions" on teacher_suggestions
  for delete using (true);

drop policy if exists "public read active questions" on questions;
create policy "public read active questions" on questions
  for select using (status = 'active');

drop policy if exists "public insert questions" on questions;
create policy "public insert questions" on questions
  for insert with check (true);

drop policy if exists "public update questions" on questions;
create policy "public update questions" on questions
  for update using (true) with check (true);

drop policy if exists "public delete questions" on questions;
create policy "public delete questions" on questions
  for delete using (true);

drop policy if exists "public read active answers" on answers;
create policy "public read active answers" on answers
  for select using (status = 'active');

drop policy if exists "public insert answers" on answers;
create policy "public insert answers" on answers
  for insert with check (true);

drop policy if exists "public update answers" on answers;
create policy "public update answers" on answers
  for update using (true) with check (true);

drop policy if exists "public delete answers" on answers;
create policy "public delete answers" on answers
  for delete using (true);

drop policy if exists "public read question votes" on question_votes;
create policy "public read question votes" on question_votes for select using (true);

drop policy if exists "public read answer votes" on answer_votes;
create policy "public read answer votes" on answer_votes for select using (true);

drop policy if exists "public read question reports" on question_reports;
create policy "public read question reports" on question_reports for select using (true);

drop policy if exists "public read answer reports" on answer_reports;
create policy "public read answer reports" on answer_reports for select using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Storage — "papers" bucket for uploaded PDFs
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('papers', 'papers', true)
on conflict (id) do nothing;

drop policy if exists "public read papers bucket" on storage.objects;
create policy "public read papers bucket" on storage.objects
  for select using (bucket_id = 'papers');

drop policy if exists "public upload papers bucket" on storage.objects;
create policy "public upload papers bucket" on storage.objects
  for insert with check (bucket_id = 'papers');
