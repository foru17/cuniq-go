import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadToR2(
  key: string,
  body: string | Buffer,
  contentType: string = 'application/json'
) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read', // Ensure it's public if your bucket policy allows it, or rely on bucket settings
    });

    await s3Client.send(command);
    console.log(`[R2] Uploaded ${key} successfully`);
    
    // Return the public URL
    const domain = process.env.S3_DOMAIN_HOST?.replace(/\/$/, '');
    return `${domain}/${key}`;
  } catch (error) {
    console.error('[R2] Upload failed:', error);
    throw error;
  }
}
