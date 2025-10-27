# Supabase Setup Checklist

Use this checklist to ensure all Supabase backend infrastructure is properly configured.

## ✅ Task 2: Set up Supabase backend infrastructure

### Sub-task 1: Create Supabase project and obtain credentials

- [ ] Created new Supabase project at https://app.supabase.com
- [ ] Project is fully provisioned and ready
- [ ] Copied Project URL from Settings → API
- [ ] Copied anon/public key from Settings → API
- [ ] Copied service_role key from Settings → API (⚠️ Keep secret!)
- [ ] Created `.env.local` file in `speaking-coach` directory
- [ ] Added all three credentials to `.env.local`
- [ ] Verified `.env.local` is in `.gitignore`

### Sub-task 2: Create `videos` storage bucket with private access

- [ ] Navigated to Storage section in Supabase dashboard
- [ ] Created new bucket named `videos`
- [ ] Verified bucket is set to **Private** (not public)
- [ ] Bucket appears in the storage list

### Sub-task 3: Create `feedback_sessions` table with schema

- [ ] Opened SQL Editor in Supabase dashboard
- [ ] Ran the `supabase-setup.sql` script
- [ ] Verified table creation was successful
- [ ] Confirmed table has columns: `id`, `user_id`, `video_path`, `feedback_text`, `created_at`
- [ ] Verified indexes were created: `idx_feedback_sessions_user_id`, `idx_feedback_sessions_created_at`

### Sub-task 4: Configure Row Level Security policies for feedback_sessions table

- [ ] Verified RLS is enabled on `feedback_sessions` table
- [ ] Confirmed policy exists: "Users can view own feedback" (SELECT)
- [ ] Confirmed policy exists: "Users can insert own feedback" (INSERT)
- [ ] Confirmed policy exists: "Users can update own feedback" (UPDATE)
- [ ] Confirmed policy exists: "Users can delete own feedback" (DELETE)
- [ ] Ran verification query to check policies

### Sub-task 5: Configure storage policies for videos bucket (user-specific access)

- [ ] Verified storage bucket policies were created
- [ ] Confirmed policy exists: "Users can upload own videos" (INSERT)
- [ ] Confirmed policy exists: "Users can read own videos" (SELECT)
- [ ] Confirmed policy exists: "Users can update own videos" (UPDATE)
- [ ] Confirmed policy exists: "Users can delete own videos" (DELETE)
- [ ] Policies enforce user-specific folder structure: `user_{userId}/`

### Sub-task 6: Enable email/password and Google OAuth in Supabase Auth settings

#### Email/Password Authentication
- [ ] Navigated to Authentication → Providers
- [ ] Verified Email provider is enabled
- [ ] Configured email confirmation settings (optional for MVP)

#### Google OAuth
- [ ] Created OAuth credentials in Google Cloud Console
- [ ] Created OAuth client ID (Web application type)
- [ ] Added authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
- [ ] Added local development redirect URI: `http://localhost:3000/auth/callback`
- [ ] Copied Google Client ID
- [ ] Copied Google Client Secret
- [ ] Enabled Google provider in Supabase Authentication → Providers
- [ ] Pasted Client ID and Client Secret in Supabase
- [ ] Saved Google OAuth configuration

## Verification Commands

Run these in the Supabase SQL Editor to verify everything is set up correctly:

```sql
-- 1. Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'feedback_sessions';

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'feedback_sessions';

-- 3. Check table policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'feedback_sessions';

-- 4. Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'videos';

-- 5. Check storage policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%videos%';
```

## Expected Results

✅ **Table**: `feedback_sessions` exists with 5 columns
✅ **RLS**: Enabled (`rowsecurity = true`)
✅ **Table Policies**: 4 policies (select, insert, update, delete)
✅ **Storage Bucket**: `videos` exists with `public = false`
✅ **Storage Policies**: 4 policies (insert, select, update, delete)
✅ **Auth Providers**: Email and Google OAuth enabled

## Requirements Satisfied

This task satisfies the following requirements from `requirements.md`:

- ✅ **5.2**: Supabase Auth for session management
- ✅ **5.3**: Videos stored in Supabase Storage bucket named "videos"
- ✅ **5.4**: Feedback stored in feedback_sessions table
- ✅ **5.5**: feedback_sessions table has correct schema (id, user_id, video_path, feedback_text, created_at)
- ✅ **5.6**: Signed URLs created using Supabase Storage API

## Next Steps

Once all items are checked:

1. Mark Task 2 as complete in `tasks.md`
2. Proceed to **Task 3: Create Supabase client utilities and type definitions**
3. Start integrating Supabase into your Next.js application

## Troubleshooting

If any checklist item fails, refer to the detailed troubleshooting section in `SUPABASE_SETUP_GUIDE.md`.
