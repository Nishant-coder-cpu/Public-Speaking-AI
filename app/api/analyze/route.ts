import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateDownloadUrl } from '@/lib/s3Client';
import { AIModelRequest, AIModelResponse } from '@/lib/types';

/**
 * POST /api/analyze
 * Orchestrates video analysis workflow:
 * 1. Validates request body (userId, videoPath/s3Key)
 * 2. Creates signed URL from AWS S3 with 10-minute expiration
 * 3. Sends POST request to AI model endpoint with signed video URL
 * 4. Parses AI model response to extract feedback text
 * 5. Inserts feedback record into feedback_sessions table
 * 6. Returns success response with feedback text to client
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const { userId, videoPath } = body;

    // Validate required fields
    if (!userId || !videoPath) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId and videoPath are required',
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    const aiModelEndpoint = process.env.AI_MODEL_ENDPOINT;
    if (!aiModelEndpoint) {
      console.error('AI_MODEL_ENDPOINT environment variable is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is not configured',
        },
        { status: 500 }
      );
    }

    // 2. Create signed URL from AWS S3 with 10-minute expiration
    let signedUrl: string;
    try {
      signedUrl = await generateDownloadUrl(videoPath, 600); // 600 seconds = 10 minutes
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate video access URL',
        },
        { status: 500 }
      );
    }

    // 3. Send POST request to AI model endpoint with signed video URL
    const aiRequest: AIModelRequest = {
      videoUrl: signedUrl,
    };

    let aiResponse: Response;
    let feedback: string;

    try {
      aiResponse = await fetch(aiModelEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequest),
      });

      if (!aiResponse.ok) {
        console.error(
          `AI model endpoint returned error: ${aiResponse.status} ${aiResponse.statusText}`
        );
        return NextResponse.json(
          {
            success: false,
            error: 'AI service is temporarily unavailable',
          },
          { status: 503 }
        );
      }

      // 4. Parse AI model response to extract feedback text
      const aiData: AIModelResponse = await aiResponse.json();
      feedback = aiData.feedback;

      if (!feedback) {
        console.error('AI model response missing feedback field');
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid response from AI service',
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Failed to communicate with AI model endpoint:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to analyze video. Please try again later.',
        },
        { status: 503 }
      );
    }

    // 5. Insert feedback record into feedback_sessions table
    try {
      const { error: dbError } = await supabaseServer
        .from('feedback_sessions')
        .insert({
          user_id: userId,
          video_path: videoPath,
          feedback_text: feedback,
        });

      if (dbError) {
        console.error('Failed to insert feedback into database:', dbError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to save feedback',
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Database operation failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save feedback',
        },
        { status: 500 }
      );
    }

    // 6. Return success response with feedback text to client
    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in /api/analyze:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
