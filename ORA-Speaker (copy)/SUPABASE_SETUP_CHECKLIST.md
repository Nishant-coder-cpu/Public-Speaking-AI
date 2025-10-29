# Supabase Setup Checklist

Use this checklist to track your progress setting up the Supabase backend.

## Setup Progress

### ☐ 1. Create Supabase Project
- [ ] Sign up/log in to Supabase (https://app.supabase.com)
- [ ] Create new project named `speaking-coach-mvp`
- [ ] Choose a strong database password
- [ ] Select appropriate region
- [ ] Wait for project provisioning to complete

### ☐ 2. Obtain and Configure Credentials
- [ ] Navigate to Settings → API
- [ ] Copy Project URL
- [ ] Copy anon/public key
- [ ] Copy service_role key
- [ ] Create `.env.local` file in project root (copy from `.env.local.example`)
- [ ] Update `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- [ ] Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- [ ] Update `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`

### ☐ 3. Create Videos Storage Bucket
- [ ] Navigate to Storage in Supabase dashboard
- [ ] Click "Create a new bucket"
- [ ] Name: `videos`
- [ ] Public bucket: **UNCHECKED** (private)
- [ ] File size limit: 150 MB
- [ ] Allowed MIME types: `video/mp4`
- [ ] Click "Create bucket"
- [ ] Verify bucket appears in Storage list

### ☐ 4. Run Database Setup Script
- [ ] Navigate to SQL Editor in Supabase dashboard
- [ ] Click "New query"
- [ ] Open `supabase-setup.sql` file from project
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" (or Ctrl+Enter / Cmd+Enter)
- [ ] Verify all commands executed successfully
- [ ] Check for any error messages

### ☐ 5. Verify Database Table
- [ ] Navigate to Table Editor
- [ ] Confirm `feedback_sessions` table exists
- [ ] Verify columns:
  - [ ] `id` (uuid, primary key)
  - [ ] `user_id` (uuid, foreign key)
  - [ ] `video_path` (text)
  - [ ] `feedback_text` (text)
  - [ ] `created_at` (timestamptz)

### ☐ 6. Verify Row Level Security
- [ ] Navigate to Authentication → Policies
- [ ] Select `feedback_sessions` table
- [ ] Verify 4 policies exist:
  - [ ] "Users can view own feedback" (SELECT)
  - [ ] "Users can insert own feedback" (INSERT)
  - [ ] "Users can update own feedback" (UPDATE)
  - [ ] "Users can delete own feedback" (DELETE)

### ☐ 7. Verify Storage Policies
- [ ] Navigate to Storage → Policies
- [ ] Select `videos` bucket
- [ ] Verify 4 policies exist:
  - [ ] "Users can upload own videos" (INSERT)
  - [ ] "Users can read own videos" (SELECT)
  - [ ] "Users can update own videos" (UPDATE)
  - [ ] "Users can delete own videos" (DELETE)

### ☐ 8. Enable Email/Password Authentication
- [ ] Navigate to Authentication → Providers
- [ ] Find "Email" provider
- [ ] Verify it's enabled (should be by default)
- [ ] Configure email confirmation settings (optional for dev)
- [ ] Click "Save"

### ☐ 9. Enable Google OAuth (Optional but Recommended)
- [ ] Navigate to Authentication → Providers
- [ ] Find "Google" provider
- [ ] Toggle "Enable Google provider" to ON
- [ ] Go to Google Cloud Console (https://console.cloud.google.com/)
- [ ] Create/select project
- [ ] Navigate to APIs & Services → Credentials
- [ ] Create OAuth 2.0 Client ID
- [ ] Configure OAuth consent screen
- [ ] Application type: Web application
- [ ] Add authorized redirect URI: `https://[your-project-id].supabase.co/auth/v1/callback`
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] Paste Client ID in Supabase Google provider settings
- [ ] Paste Client Secret in Supabase Google provider settings
- [ ] Click "Save" in Supabase

### ☐ 10. Final Verification
- [ ] All environment variables are set in `.env.local`
- [ ] Storage bucket `videos` is created and private
- [ ] Table `feedback_sessions` exists with correct schema
- [ ] RLS is enabled on `feedback_sessions` table
- [ ] All RLS policies are created for database table
- [ ] All storage policies are created for videos bucket
- [ ] Email authentication is enabled
- [ ] Google OAuth is configured (if using)
- [ ] `.env.local` is NOT committed to git

## Quick Test (Optional)
- [ ] Create a test user in Authentication → Users
- [ ] Note the test user's email and password
- [ ] Ready to test authentication in the application

## Troubleshooting Reference

If you encounter issues, refer to the **Troubleshooting** section in `SUPABASE_SETUP_GUIDE.md`.

## Next Steps

Once all items are checked:
- ✅ Task 2 is complete
- ➡️ Proceed to Task 3: Create Supabase client utilities and type definitions

---

**Setup completed on:** _______________

**Project URL:** _______________

**Notes:**
