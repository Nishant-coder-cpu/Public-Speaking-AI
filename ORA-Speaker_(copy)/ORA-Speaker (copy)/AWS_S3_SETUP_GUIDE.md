# AWS S3 Setup Guide for Video Storage

This guide walks you through setting up AWS S3 for storing video files in the Speaking Coach application.

## Prerequisites

- An AWS account (sign up at https://aws.amazon.com if you don't have one)

## Step-by-Step Setup

### 1. Create an S3 Bucket

1. Go to the AWS Console: https://console.aws.amazon.com
2. Navigate to **S3** service (search for "S3" in the top search bar)
3. Click **"Create bucket"**
4. Configure the bucket:
   - **Bucket name**: `speaking-coach-videos` (must be globally unique, adjust if needed)
   - **AWS Region**: Choose a region close to your users (e.g., `us-east-1`)
   - **Block Public Access settings**: Keep all boxes **CHECKED** (block all public access)
   - **Bucket Versioning**: Disabled (optional for MVP)
   - **Default encryption**: Enable (recommended)
5. Click **"Create bucket"**

### 2. Configure CORS Policy

1. In the S3 console, click on your newly created bucket
2. Go to the **Permissions** tab
3. Scroll down to **Cross-origin resource sharing (CORS)**
4. Click **"Edit"**
5. Paste the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **"Save changes"**

**Note**: Update `AllowedOrigins` with your actual production domain when deploying.

### 3. Create IAM User for Programmatic Access

1. Navigate to **IAM** service in AWS Console
2. Click **"Users"** in the left sidebar
3. Click **"Create user"**
4. Configure the user:
   - **User name**: `speaking-coach-s3-user`
   - **Access type**: Select **"Programmatic access"** (no console access needed)
5. Click **"Next"**

### 4. Set Permissions for IAM User

1. Select **"Attach policies directly"**
2. Click **"Create policy"**
3. In the new tab, select the **JSON** tab
4. Paste the following policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

5. Click **"Next"**
6. Name the policy: `SpeakingCoachS3Policy`
7. Click **"Create policy"**
8. Go back to the user creation tab and refresh the policy list
9. Search for and select `SpeakingCoachS3Policy`
10. Click **"Next"** and then **"Create user"**

### 5. Generate Access Keys

1. After creating the user, click on the user name
2. Go to the **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"** and then **"Create access key"**
7. **IMPORTANT**: Copy both:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (only shown once!)
8. Store these securely - you'll need them for your `.env.local` file

### 6. Update Environment Variables

1. Open your `.env.local` file (create it from `.env.local.example` if needed)
2. Add your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
AWS_S3_BUCKET_NAME=speaking-coach-videos
```

3. **IMPORTANT**: Ensure `.env.local` is in your `.gitignore` file

### 7. Install Dependencies

Run the following command to install AWS SDK:

```bash
npm install
```

The AWS SDK packages are already added to `package.json`:

- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

### 8. Verify Setup

You can test the setup by:

1. Starting your development server: `npm run dev`
2. Logging into your application
3. Attempting to upload a video file
4. Check the S3 bucket in AWS Console to verify the file was uploaded

## Security Best Practices

- ⚠️ **NEVER** commit your `.env.local` file to version control
- ⚠️ **NEVER** expose your AWS credentials in client-side code
- ⚠️ Keep your bucket private (block all public access)
- ⚠️ Use pre-signed URLs for temporary access (already implemented)
- ⚠️ Regularly rotate your access keys
- ⚠️ Use IAM policies with least privilege (only necessary permissions)

## Cost Considerations

AWS S3 pricing (as of 2024):

- **Storage**: ~$0.023 per GB/month (first 50 TB)
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer out**: $0.09 per GB (after first 100 GB/month free)

**For MVP with moderate usage:**

- 100 videos × 100MB = 10GB storage = ~$0.23/month
- 1,000 uploads = ~$0.005
- 10,000 views = ~$0.004
- **Total**: Less than $1/month for testing

**AWS Free Tier** (first 12 months):

- 5GB storage
- 20,000 GET requests
- 2,000 PUT requests
- 100GB data transfer out

## Troubleshooting

### Issue: CORS errors in browser

**Solution**:

- Verify CORS policy is correctly configured in S3 bucket
- Ensure your domain is listed in `AllowedOrigins`
- Check browser console for specific CORS error messages

### Issue: Access Denied errors

**Solution**:

- Verify IAM policy has correct permissions
- Check that bucket name in policy matches actual bucket name
- Ensure access keys are correctly set in `.env.local`

### Issue: Pre-signed URL not working

**Solution**:

- Verify AWS credentials are valid
- Check that the region in `.env.local` matches your bucket region
- Ensure the S3 key (file path) is correctly formatted

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## Next Steps

Once setup is complete:

- ✅ Your AWS S3 storage is ready
- ✅ Update your `.env.local` file with AWS credentials
- ✅ Test video upload functionality
- ✅ Proceed to Task 12: Implement /api/analyze endpoint
