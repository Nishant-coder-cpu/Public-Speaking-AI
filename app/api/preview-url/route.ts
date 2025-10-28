import { NextRequest, NextResponse } from 'next/server';
import { generateDownloadUrl } from '@/lib/s3Client';
import { supabaseServer } from '@/lib/supabaseServer';

/**
 * POST /api/preview-url
 * Generates a signed download URL for video preview
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the user's session
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      );
    }

    // Parse request body
    const { s3Key } = await request.json();

    if (!s3Key) {
      return NextResponse.json(
        { error: 'Missing required field: s3Key' },
        { status: 400 }
      );
    }

    // Verify the S3 key belongs to the authenticated user
    if (!s3Key.startsWith(`user_${user.id}/`)) {
      return NextResponse.json(
        { error: 'Forbidden: Access denied to this resource' },
        { status: 403 }
      );
    }

    // Generate signed download URL (valid for 1 hour for preview)
    const previewUrl = await generateDownloadUrl(s3Key, 3600);

    return NextResponse.json({ previewUrl });
  } catch (error) {
    console.error('Error generating preview URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview URL' },
      { status: 500 }
    );
  }
}
