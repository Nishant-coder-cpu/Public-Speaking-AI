-- Supabase Backend Infrastructure Setup
-- Run this script in your Supabase SQL Editor after creating your project

-- ============================================
-- 1. Create feedback_sessions table
-- ============================================

create table if not exists feedback_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  video_path text not null,
  feedback_text text,
  created_at timestamptz default now() not null
);

-- Create indexes for better query performance
create index if not exists idx_feedback_sessions_user_id 
  on feedback_sessions(user_id);

create index if not exists idx_feedback_sessions_created_at 
  on feedback_sessions(created_at desc);

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================

alter table feedback_sessions enable row level security;

-- ============================================
-- 3. Create RLS Policies for feedback_sessions
-- ============================================

-- Policy: Users can view their own feedback
create policy "Users can view own feedback"
  on feedback_sessions
  for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
create policy "Users can insert own feedback"
  on feedback_sessions
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own feedback (optional, for future use)
create policy "Users can update own feedback"
  on feedback_sessions
  for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own feedback (optional, for future use)
create policy "Users can delete own feedback"
  on feedback_sessions
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- 4. Storage Bucket Policies (videos bucket)
-- ============================================
-- Note: The bucket must be created first via the Supabase Dashboard
-- Then run these policies in the SQL Editor

-- Policy: Users can upload videos to their own folder
insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

-- Policy: Users can upload to their own user folder
create policy "Users can upload own videos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'videos' and
    (storage.foldername(name))[1] = concat('user_', auth.uid()::text)
  );

-- Policy: Users can read their own videos
create policy "Users can read own videos"
  on storage.objects
  for select
  using (
    bucket_id = 'videos' and
    (storage.foldername(name))[1] = concat('user_', auth.uid()::text)
  );

-- Policy: Users can update their own videos (optional)
create policy "Users can update own videos"
  on storage.objects
  for update
  using (
    bucket_id = 'videos' and
    (storage.foldername(name))[1] = concat('user_', auth.uid()::text)
  );

-- Policy: Users can delete their own videos (optional)
create policy "Users can delete own videos"
  on storage.objects
  for delete
  using (
    bucket_id = 'videos' and
    (storage.foldername(name))[1] = concat('user_', auth.uid()::text)
  );

-- ============================================
-- 5. Verify Setup
-- ============================================

-- Check if table exists
select table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_name = 'feedback_sessions';

-- Check if RLS is enabled
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
  and tablename = 'feedback_sessions';

-- Check policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where tablename = 'feedback_sessions';

-- Check storage bucket
select * from storage.buckets where id = 'videos';
