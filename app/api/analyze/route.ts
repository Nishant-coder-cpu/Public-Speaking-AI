import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateDownloadUrl } from '@/lib/s3Client';

/**
 * POST /api/analyze
 * Orchestrates video analysis workflow using Google Gemini:
 * 1. Validates request body (userId, videoPath/s3Key)
 * 2. Downloads video from S3
 * 3. Uploads video to Gemini File API
 * 4. Sends video to Gemini for analysis
 * 5. Receives AI-generated feedback on speaking performance
 * 6. Inserts feedback record into feedback_sessions table
 * 7. Returns success response with feedback text to client
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
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY environment variable is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'AI service is not configured',
        },
        { status: 500 }
      );
    }

    // 2. Create signed URL from AWS S3
    let signedUrl: string;
    try {
      signedUrl = await generateDownloadUrl(videoPath, 3600); // 1 hour for upload
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

    // 3. Download video from S3
    let videoBuffer: Buffer;
    try {
      const videoResponse = await fetch(signedUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }
      const arrayBuffer = await videoResponse.arrayBuffer();
      videoBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Failed to download video from S3:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to download video for analysis',
        },
        { status: 500 }
      );
    }

    // 4. Upload video to Gemini File API and analyze
    let feedback: string;

    try {
      const fileManager = new GoogleAIFileManager(geminiApiKey);
      const genAI = new GoogleGenerativeAI(geminiApiKey);

      // Write video to temp file
      const fs = await import('fs/promises');
      const path = await import('path');
      const os = await import('os');
      
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `video-${Date.now()}.mp4`);
      
      await fs.writeFile(tempFilePath, videoBuffer);

      // Upload to Gemini
      const uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'video/mp4',
        displayName: videoPath,
      });

      // Clean up temp file
      await fs.unlink(tempFilePath);

      // Wait for file to be processed
      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === 'FAILED') {
        throw new Error('Video processing failed');
      }

      // Generate content with the uploaded file
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Analyze this public speaking presentation video and provide detailed, constructive feedback. Focus on:

1. **Speaking Pace & Clarity**: Is the pace appropriate? Is speech clear and articulate?
2. **Filler Words**: Count and identify filler words (um, uh, like, you know, etc.)
3. **Body Language**: Assess posture, gestures, and movement
4. **Eye Contact**: Evaluate engagement with the audience/camera
5. **Tone & Volume**: Is the tone engaging? Is volume appropriate?
6. **Overall Presentation Skills**: Confidence, structure, engagement

Format your response with:
- **Strengths**: 2-3 specific positive observations
- **Areas for Improvement**: 2-3 actionable suggestions
- **Overall Assessment**: Brief summary with encouragement

Be constructive, specific, and encouraging.`;

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType,
          },
        },
      ]);

      feedback = result.response.text();

      // Clean up uploaded file from Gemini
      await fileManager.deleteFile(uploadResult.file.name);

      if (!feedback) {
        console.error('Gemini API returned empty feedback');
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid response from AI service',
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Failed to analyze video with Gemini:', error);
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
