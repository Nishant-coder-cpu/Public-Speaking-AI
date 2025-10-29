# Supabase Setup Guide for Speaking Coach MVP

This guide walks you through setting up the Supabase backend infrastructure for the Speaking Coach application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com if you don't have one)

## Step-by-Step Setup

### 1. Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `speaking-coach-mvp` (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for MVP
4. Click **"Create new project"**
5. Wait for the project to finish provisioning (2-3 minutes)

### 2. Obtain Project Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. Copy the following values (you'll need these for your `.env.local` file):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - ⚠️ Keep this secret!

3. Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
AI_MODEL_ENDPOINT=https://your-ai-endpoint.com/analyze
```

### 3. Create the Videos Storage Bucket

1. In the Supabase dashboard, go to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Configure the bucket:
   - **Name**: `videos`
   - **Public bucket**: ❌ **UNCHECK** (keep it private)
   - **File size limit**: 150 MB (150000000 bytes)
   - **Allowed MIME types**: `video/mp4`
4. Click **"Create bucket"**

### 4. Run the Database Setup Script

1. In the Supabase dashboard, go to **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
6. Verify that all commands executed successfully (you should see success messages)

The script will:
- ✅ Create the `feedback_sessions` table with proper schema
- ✅ Create indexes for better performance
- ✅ Enable Row Level Security (RLS)
- ✅ Create RLS policies for the `feedback_sessions` table
- ✅ Create storage policies for the `videos` bucket
- ✅ Run verification queries to confirm setup

### 5. Enable Authentication Providers

#### Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** in the left sidebar
2. Find **Email** in the list
3. Ensure it's **enabled** (it should be enabled by default)
4. Configure settings:
   - **Enable email confirmations**: Optional (disable for faster testing during development)
   - **Secure email change**: Recommended to keep enabled
5. Click **"Save"**

#### Enable Google OAuth

1. In the same **Authentication** → **Providers** page
2. Find **Google** in the list and click on it
3. Toggle **"Enable Google provider"** to ON
4. You'll need to set up Google OAuth credentials:

   **a. Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
   - Configure the OAuth consent screen if prompted
   - Application type: **Web application**
   - Add authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**
   - Copy the **Client ID** and **Client Secret**

   **b. Configure in Supabase:**
   - Paste the **Client ID** in the Supabase Google provider settings
   - Paste the **Client Secret** in the Supabase Google provider settings
   - Click **"Save"**

### 6. Verify the Setup

#### Verify Database Table

1. Go to **Table Editor** in the left sidebar
2. You should see the `feedback_sessions` table
3. Click on it to verify the schema:
   - `id` (uuid, primary key)
   - `user_id` (uuid, foreign key to auth.users)
   - `video_path` (text)
   - `feedback_text` (text)
   - `created_at` (timestamptz)

#### Verify Storage Bucket

1. Go to **Storage** in the left sidebar
2. You should see the `videos` bucket
3. Click on it - it should be empty initially
4. Verify it's marked as **Private**

#### Verify RLS Policies

1. Go to **Authentication** → **Policies** in the left sidebar
2. Select the `feedback_sessions` table
3. You should see 4 policies:
   - Users can view own feedback (SELECT)
   - Users can insert own feedback (INSERT)
   - Users can update own feedback (UPDATE)
   - Users can delete own feedback (DELETE)

4. Go to **Storage** → **Policies**
5. Select the `videos` bucket
6. You should see 4 policies:
   - Users can upload own videos (INSERT)
   - Users can read own videos (SELECT)
   - Users can update own videos (UPDATE)
   - Users can delete own videos (DELETE)

### 7. Test the Setup (Optional)

You can test the setup by creating a test user:

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter a test email and password
4. Click **"Create user"**
5. Try logging in with this user in your application once it's built

## Troubleshooting

### Issue: Storage policies not working

**Solution**: Make sure you created the `videos` bucket BEFORE running the SQL script. If you ran the script first, the storage policies might have failed. Re-run just the storage policy section of the SQL script.

### Issue: RLS blocking all queries

**Solution**: Verify that your policies are using `auth.uid()` correctly. Test by temporarily disabling RLS to confirm the issue:
```sql
alter table feedback_sessions disable row level security;
```
Then re-enable it after fixing policies:
```sql
alter table feedback_sessions enable row level security;
```

### Issue: Google OAuth not working

**Solution**: 
- Double-check the redirect URI in Google Cloud Console matches exactly: `https://your-project-id.supabase.co/auth/v1/callback`
- Ensure the OAuth consent screen is configured and published
- Check that the Client ID and Secret are correctly copied

### Issue: Can't upload videos

**Solution**:
- Verify the bucket is named exactly `videos` (case-sensitive)
- Check that storage policies are created correctly
- Ensure the user is authenticated when attempting upload
- Check browser console for specific error messages

## Next Steps

After completing this setup:

1. ✅ Your Supabase backend is ready
2. ✅ Update your `.env.local` file with the credentials
3. ✅ Proceed to Task 3: Create Supabase client utilities and type definitions

## Security Reminders

- ⚠️ **NEVER** commit your `.env.local` file to version control
- ⚠️ **NEVER** expose your `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- ⚠️ Keep your database password secure
- ⚠️ Regularly review your RLS policies to ensure data security
- ⚠️ Use the service role key only in server-side API routes

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
