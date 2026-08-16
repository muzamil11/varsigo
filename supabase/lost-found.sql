-- NEDHub Lost & Found
-- Run this once in the live Supabase SQL editor before using Lost & Found.
-- Public clients do not get direct read/write policies; the app uses
-- community-action/admin-action after Firebase token verification.

create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  kind text not null check (kind in ('lost', 'found')),
  item_name text not null,
  description text not null,
  university text not null default 'NED University',
  campus text,
  location text not null,
  contact_name text not null,
  whatsapp text,
  email text not null,
  photo_url text,
  approved boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'resolved', 'hidden')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.lost_found_items enable row level security;

drop policy if exists "public read lost found" on public.lost_found_items;
drop policy if exists "public insert lost found" on public.lost_found_items;
drop policy if exists "public update lost found" on public.lost_found_items;
drop policy if exists "public delete lost found" on public.lost_found_items;

create index if not exists lost_found_items_status_created_idx
  on public.lost_found_items (status, approved, created_at desc);

create index if not exists lost_found_items_kind_created_idx
  on public.lost_found_items (kind, created_at desc);
