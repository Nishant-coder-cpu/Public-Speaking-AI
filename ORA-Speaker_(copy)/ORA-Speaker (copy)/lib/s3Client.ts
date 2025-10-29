// AWS S3 client for video storage operations
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generate a pre-signed URL for uploading a file to S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 */
export async function generateUploadUrl(
  key: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: 'video/mp4',
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a pre-signed URL for downloading/viewing a file from S3
 * @param key - The S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 10 minutes)
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = 600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export { s3Client, BUCKET_NAME };
