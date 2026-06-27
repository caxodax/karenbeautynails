import { json } from '@sveltejs/kit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return json({ error: 'No se encontró ningún archivo.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return json({ error: 'El archivo debe ser una imagen.' }, { status: 400 });
    }

    // Convert file to Uint8Array instead of Node Buffer for cross-compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Create unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${extension}`;

    // Upload to Cloudflare R2
    const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // Cloudflare R2 doesn't technically need ACLs for public buckets if bucket is public, but good practice
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `${env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;

    return json({ url: publicUrl });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return json({ error: error?.message || 'Fallo al subir la imagen al servidor.' }, { status: 500 });
  }
}
