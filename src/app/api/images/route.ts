import { ListObjectsV2Command, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Bucket name from environment variables
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export async function GET() {
  try {
    // List all objects in the uploads directory of the bucket
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'uploads/', // Prefix to filter objects in the uploads folder
      MaxKeys: 100, // Limit the number of objects returned
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return NextResponse.json({ images: [] });
    }

    // Process each object to get a signed URL
    const imagesPromises = response.Contents.map(async (object) => {
      if (!object.Key) return null;

      // Only include image files
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(object.Key);
      if (!isImage) return null;

      // Create a command to get the object
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: object.Key,
      });

      // Generate a signed URL for the image (valid for 1 hour)
      const url = await getSignedUrl(s3Client, getCommand, {
        expiresIn: 3600,
      });

      // Extract a name from the key
      const fileName = object.Key.split('/').pop() || '';

      return {
        key: object.Key,
        url,
        fileName,
        lastModified: object.LastModified,
        size: object.Size,
      };
    });

    // Wait for all promises to resolve and filter out nulls
    const images = (await Promise.all(imagesPromises)).filter(Boolean);

    // Sort images by last modified date (newest first)
    images.sort((a, b) => {
      if (!a?.lastModified || !b?.lastModified) return 0;
      return b.lastModified.getTime() - a.lastModified.getTime();
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images from S3:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
