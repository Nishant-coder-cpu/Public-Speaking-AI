# Supabase Backend Infrastructure Setup Guide

This guide walks you through setting up the Supabase backend infrastructure for the Speaking Coach MVP.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to the Supabase dashboard

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `speaking-coach` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for MVP
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 2. Obtain Project Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Copy the following values (you'll need these for your `.env.local` file):
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. Create/update your `.env.local` file in the `speaking-coach` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
AI_MODEL_ENDPOINT=https://your-ai-endpoint.com/analyze
```

### 3. Create Database Tables and Policies

1. In the Supabase dashboard, go to **SQL Editor** in the left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
6. Verify that all statements executed successfully (you should see success messages)

This script will:
- Create the `feedback_sessions` table with proper schema
- Add indexes for performance
- Enable Row Level Security (RLS)
- Create RLS policies for user data isolation
- Create the `videos` storage bucket
- Set up storage policies for user-specific access

### 4. Verify Storage Bucket

1. Go to **Storage** in the left sidebar
2. You should see a bucket named `videos`
3. Click on the bucket to verify it was created
4. Check that it's set to **Private** (not public)

If the bucket wasn't created automatically by the SQL script:
1. Click "Create a new bucket"
2. Name it `videos`
3. Keep it **Private** (uncheck "Public bucket")
4. Click "Create bucket"
5. Then re-run the storage policies section of the SQL script

### 5. Configure Authentication Settings

#### Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in the left sidebar
2. Find **Email** provider
3. Ensure it's **Enabled** (it should be by default)
4. Configure email settings:
   - **Enable email confirmations**: Optional (disable for faster testing during development)
   - **Secure email change**: Recommended to keep enabled

#### Enable Google OAuth

1. In **Authentication** → **Providers**, find **Google**
2. Click on **Google** to configure it
3. You'll need to create OAuth credentials in Google Cloud Console:

   **Google Cloud Console Setup:**
   - Go to https://console.cloud.google.com
   - Create a new project or select an existing one
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local development)
   - Copy the **Client ID** and **Client Secret**

4. Back in Supabase, paste the credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Click **Save**

### 6. Verify Setup

Run these verification steps in the SQL Editor:

```sql
-- Check if feedback_sessions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'feedback_sessions';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'feedback_sessions';

-- Check RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'feedback_sessions';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'videos';

-- Check storage policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%videos%';
```

Expected results:
- ✅ `feedback_sessions` table exists
- ✅ RLS is enabled (`rowsecurity = true`)
- ✅ 4 RLS policies for feedback_sessions (select, insert, update, delete)
- ✅ `videos` bucket exists with `public = false`
- ✅ 4 storage policies for videos bucket (insert, select, update, delete)

### 7. Test the Setup (Optional)

You can test the setup with a simple query:

```sql
-- This should return an empty result (no feedback sessions yet)
SELECT * FROM feedback_sessions;

-- This should show the videos bucket configuration
SELECT * FROM storage.buckets WHERE id = 'videos';
```

## Troubleshooting

### Issue: Storage policies fail to create

**Solution**: Make sure the `videos` bucket exists first. Create it manually via the Storage UI, then re-run the storage policy section of the SQL script.

### Issue: RLS policies prevent access

**Solution**: Verify that you're using the correct Supabase client (client-side vs server-side). The service role key bypasses RLS, while the anon key enforces it.

### Issue: Google OAuth not working

**Solution**: 
- Double-check the redirect URIs in Google Cloud Console
- Ensure the Client ID and Secret are correct
- Make sure the OAuth consent screen is configured in Google Cloud Console

### Issue: Can't connect to Supabase from Next.js

**Solution**:
- Verify environment variables are set correctly in `.env.local`
- Restart your Next.js dev server after adding environment variables
- Check that the Supabase URL and keys are correct (no extra spaces)

## Next Steps

After completing this setup:

1. ✅ Your Supabase project is ready
2. ✅ Database tables and policies are configured
3. ✅ Storage bucket is set up with proper access controls
4. ✅ Authentication providers are enabled

You can now proceed to **Task 3: Create Supabase client utilities and type definitions** to start integrating Supabase into your Next.js application.

## Security Checklist

- [ ] Service role key is stored securely and never committed to version control
- [ ] `.env.local` is in `.gitignore`
- [ ] RLS is enabled on all tables
- [ ] Storage bucket is private (not public)
- [ ] Google OAuth credentials are configured correctly
- [ ] Database password is strong and stored securely

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
