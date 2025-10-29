# Quick Start: AWS S3 Setup

## TL;DR - Get S3 Running in 10 Minutes

### 1. Create S3 Bucket (2 min)
- Go to AWS Console → S3
- Create bucket: `speaking-coach-videos`
- Keep all public access **BLOCKED**

### 2. Add CORS Policy (1 min)
In bucket → Permissions → CORS, paste:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 3. Create IAM User (3 min)
- IAM → Users → Create user: `speaking-coach-s3-user`
- Attach this inline policy (replace `YOUR-BUCKET-NAME`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### 4. Get Access Keys (1 min)
- User → Security credentials → Create access key
- Copy Access Key ID and Secret Access Key

### 5. Update .env.local (1 min)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=speaking-coach-videos
```

### 6. Install & Test (2 min)
```bash
npm install
npm run dev
```

Upload a video to test!

---

**Need more details?** See `AWS_S3_SETUP_GUIDE.md`

**Having issues?** Check the Troubleshooting section in the full guide
