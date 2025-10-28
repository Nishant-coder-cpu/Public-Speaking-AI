# Migration from Supabase Storage to AWS S3

## Summary

Successfully migrated video storage from Supabase Storage to AWS S3 while keeping Supabase for authentication and database.

## What Changed

### Files Modified

1. **`.env.local.example`**
   - Added AWS S3 configuration variables
   - Kept Supabase variables for auth/database

2. **`package.json`**
   - Added `@aws-sdk/client-s3` (v3.705.0)
   - Added `@aws-sdk/s3-request-presigner` (v3.705.0)

3. **`components/UploadBox.tsx`**
   - Replaced Supabase Storage upload with S3 pre-signed URL upload
   - Changed to use `/api/upload-url` endpoint to get pre-signed URLs
   - Implemented XMLHttpRequest for better progress tracking
   - Maintained same UI/UX and progress bar functionality

4. **`README.md`**
   - Updated tech stack to reflect S3 usage
   - Added AWS account to prerequisites
   - Referenced new setup guides

5. **`.kiro/specs/speaking-coach-mvp/tasks.md`**
   - Updated Task 2 to reflect S3 migration
   - Added Task 2b for AWS S3 setup
   - Updated Task 7 to describe S3 upload flow
   - Updated Task 12 to use S3 signed URLs

### Files Created

1. **`lib/s3Client.ts`**
   - S3 client configuration
   - `generateUploadUrl()` - Creates pre-signed URLs for uploads
   - `generateDownloadUrl()` - Creates pre-signed URLs for downloads/viewing

2. **`app/api/upload-url/route.ts`**
   - API endpoint to generate pre-signed S3 upload URLs
   - Verifies user authentication via Supabase
   - Returns upload URL and S3 key

3. **`AWS_S3_SETUP_GUIDE.md`**
   - Complete step-by-step guide for setting up S3
   - Includes bucket creation, CORS configuration, IAM setup
   - Security best practices and troubleshooting

4. **`MIGRATION_SUMMARY.md`** (this file)
   - Documents the migration process and changes

## Architecture

### Before (Supabase Storage)
```
User → Next.js → Supabase Storage (videos bucket)
                → Supabase Auth
                → Supabase Database
```

### After (AWS S3)
```
User → Next.js → AWS S3 (video storage)
                → Supabase Auth
                → Supabase Database
```

## Upload Flow

### Old Flow (Supabase)
1. User selects video file
2. UploadBox validates file
3. Direct upload to Supabase Storage using SDK
4. Progress tracked via SDK
5. Returns Supabase storage path

### New Flow (S3)
1. User selects video file
2. UploadBox validates file
3. Request pre-signed upload URL from `/api/upload-url`
4. API verifies user auth and generates S3 pre-signed URL
5. Direct upload to S3 using XMLHttpRequest
6. Progress tracked via XHR progress events
7. Returns S3 key (path)

## Benefits of Migration

1. **Better scalability**: S3 is designed for massive scale
2. **Lower costs**: S3 is generally cheaper for storage
3. **More control**: Direct access to S3 features and configuration
4. **Industry standard**: S3 is the most widely used object storage
5. **Better integration**: Easier to integrate with other AWS services if needed
6. **Separation of concerns**: Auth/DB separate from storage

## What Stayed the Same

- Supabase authentication (email/password, Google OAuth)
- Supabase database (`feedback_sessions` table)
- User experience (same upload UI and progress tracking)
- File validation (still 150MB MP4 limit)
- Security model (user-specific folders, private access)

## Next Steps

1. **Install dependencies**: Run `npm install` to get AWS SDK packages
2. **Set up AWS S3**: Follow `AWS_S3_SETUP_GUIDE.md`
3. **Update environment variables**: Add AWS credentials to `.env.local`
4. **Test upload flow**: Verify video uploads work correctly
5. **Update analyze endpoint**: Modify Task 12 to use S3 signed URLs

## Environment Variables Required

```env
# Supabase (Auth & Database)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AWS S3 (Video Storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=speaking-coach-videos

# AI Model
AI_MODEL_ENDPOINT=...
```

## Security Notes

- S3 bucket is private (block all public access)
- Pre-signed URLs expire after 5 minutes (uploads) or 10 minutes (downloads)
- User authentication verified before generating URLs
- IAM user has minimal permissions (only S3 access)
- AWS credentials never exposed to client-side code

## Rollback Plan (if needed)

If you need to rollback to Supabase Storage:

1. Revert `components/UploadBox.tsx` to use Supabase SDK
2. Delete `lib/s3Client.ts` and `app/api/upload-url/route.ts`
3. Remove AWS SDK packages from `package.json`
4. Restore Supabase storage bucket and policies
5. Update environment variables

## Testing Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Set up AWS S3 bucket
- [ ] Configure CORS policy
- [ ] Create IAM user and policy
- [ ] Add AWS credentials to `.env.local`
- [ ] Test video upload (check progress bar)
- [ ] Verify file appears in S3 bucket
- [ ] Test error handling (invalid file, network error)
- [ ] Test with different file sizes
- [ ] Verify authentication requirement

## Questions or Issues?

Refer to:
- `AWS_S3_SETUP_GUIDE.md` for setup help
- `SUPABASE_SETUP_GUIDE.md` for Supabase configuration
- AWS S3 documentation: https://docs.aws.amazon.com/s3/
