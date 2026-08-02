-- Adds optional course context to teacher reviews.
-- Run this once in the live Supabase SQL Editor before deploying an app build
-- that lets users choose a course while writing a review.

alter table reviews add column if not exists course_id uuid;

alter table reviews drop constraint if exists reviews_course_id_fkey;
alter table reviews
  add constraint reviews_course_id_fkey
  foreign key (course_id) references courses(id) on delete set null;

create index if not exists idx_reviews_course_id on reviews(course_id);
