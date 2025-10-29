// API endpoint to generate pre-signed S3 upload URL
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateUploadUrl } from '@/lib/s3Client';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'Missing fileName' },
        { status: 400 }
      );
    }

    // Generate S3 key: user_{userId}/{timestamp}_{fileName}
    const timestamp = Date.now();
    const s3Key = `user_${user.id}/${timestamp}_${fileName}`;

    // Generate pre-signed upload URL
    const uploadUrl = await generateUploadUrl(s3Key);

    return NextResponse.json({
      uploadUrl,
      s3Key,
    });

  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
