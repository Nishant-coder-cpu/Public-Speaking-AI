import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateDownloadUrl } from '@/lib/s3Client';
import { ExternalAIClient } from '@/lib/externalAIClient';
import { GeminiProcessor } from '@/lib/geminiProcessor';
import { ExternalAIAnalysis, AnalysisType } from '@/lib/types';
import { getPromptForAnalysis } from '@/lib/analysisPrompts';
import { createLogger } from '@/lib/logger';
import { handleError, createErrorResponse, getStatusCode } from '@/lib/errorHandler';

// Create logger instance for analyze route
const logger = createLogger('AnalyzeAPI');

// Valid analysis types for validation
const VALID_ANALYSIS_TYPES: AnalysisType[] = [
  'executive_summary',
  'strengths_failures',
  'timewise_analysis',
  'action_fixes',
  'visualizations',
];

/**
 * POST /api/analyze
 * Orchestrates video analysis workflow with multi-analysis type support:
 * 1. Validates request body (userId, videoPath, analysisType)
 * 2. Checks cache for existing analysis of this type
 * 3. If cache hit: returns cached feedback immediately
 * 4. If cache miss: checks for existing raw_analysis from any analysis type
 * 5. If no raw_analysis: downloads video and calls external AI
 * 6. Generates specialized prompt for the requested analysis type
 * 7. Processes with Gemini using custom prompt
 * 8. Stores new analysis with analysis_type in database
 * 9. Returns feedback with cached flag and analysis type
 */
export async function POST(request: NextRequest) {
  const requestTimer = logger.startTimer('analyze_request');
  
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const { userId, videoPath, analysisType } = body;

    // Validate required fields
    if (!userId || !videoPath || !analysisType) {
      const errorResponse = createErrorResponse('validation');
      logger.warn('Validation failed: missing required fields', {
        hasUserId: !!userId,
        hasVideoPath: !!videoPath,
        hasAnalysisType: !!analysisType,
      });
      return NextResponse.json(errorResponse, { status: getStatusCode('validation') });
    }

    // Validate analysisType is one of the 5 valid types
    if (!VALID_ANALYSIS_TYPES.includes(analysisType)) {
      logger.warn('Invalid analysis type provided', {
        analysisType,
        validTypes: VALID_ANALYSIS_TYPES,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid analysis type',
          message: `Analysis type must be one of: ${VALID_ANALYSIS_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      logger.error('GEMINI_API_KEY not configured', {
        userId,
        videoPath,
        analysisType,
      });
      const errorResponse = createErrorResponse('configuration');
      return NextResponse.json(errorResponse, { status: getStatusCode('configuration') });
    }

    logger.info('Starting video analysis', {
      userId,
      videoPath,
      analysisType,
    });

    // 2. Check cache: query database for existing (user_id, video_path, analysis_type) record
    try {
      const cacheTimer = logger.startTimer('cache_check');
      const { data: cachedAnalysis, error: cacheError } = await supabaseServer
        .from('feedback_sessions')
        .select('id, feedback_text')
        .eq('user_id', userId)
        .eq('video_path', videoPath)
        .eq('analysis_type', analysisType)
        .single();

      logger.endTimer(cacheTimer);

      // If cache hit: return cached feedback immediately
      if (cachedAnalysis && !cacheError) {
        logger.info('Cache hit: returning cached analysis', {
          feedbackSessionId: cachedAnalysis.id,
          analysisType,
        });

        const totalDuration = logger.endTimer(requestTimer);
        return NextResponse.json({
          success: true,
          feedback: cachedAnalysis.feedback_text,
          feedbackSessionId: cachedAnalysis.id,
          analysisType,
          cached: true,
        });
      }

      // Cache miss - proceed with analysis generation
      logger.info('Cache miss: generating new analysis', {
        analysisType,
      });
    } catch (error) {
      // Log cache check error but continue with analysis
      logger.warn('Cache check failed, proceeding with analysis', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Check for existing raw_analysis from any analysis type for this video
    let rawAnalysis: ExternalAIAnalysis | null = null;
    let needsExternalAI = false;

    try {
      const rawAnalysisTimer = logger.startTimer('raw_analysis_check');
      const { data: existingAnalysis, error: rawAnalysisError } = await supabaseServer
        .from('feedback_sessions')
        .select('raw_analysis')
        .eq('user_id', userId)
        .eq('video_path', videoPath)
        .not('raw_analysis', 'is', null)
        .limit(1)
        .single();

      logger.endTimer(rawAnalysisTimer);

      if (existingAnalysis && !rawAnalysisError && existingAnalysis.raw_analysis) {
        rawAnalysis = existingAnalysis.raw_analysis as ExternalAIAnalysis;
        logger.info('Found existing raw_analysis, reusing for new analysis type', {
          analysisType,
        });
      } else {
        needsExternalAI = true;
        logger.info('No existing raw_analysis found, will generate new one', {
          analysisType,
        });
      }
    } catch (error) {
      // If query fails, assume we need to generate new raw_analysis
      needsExternalAI = true;
      logger.warn('Failed to check for existing raw_analysis, will generate new one', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 4. If no raw_analysis exists, download video and call external AI
    let analysisSource: 'external_ai' | 'gemini_direct' | 'hybrid' = 'hybrid';

    if (needsExternalAI) {
      // Create signed URL from AWS S3
      let signedUrl: string;
      try {
        const urlTimer = logger.startTimer('s3_url_generation');
        signedUrl = await generateDownloadUrl(videoPath, 3600); // 1 hour for upload
        logger.endTimer(urlTimer);
      } catch (error) {
        logger.error('Failed to generate signed URL', {
          error: error instanceof Error ? error.message : String(error),
          videoPath,
        });
        const { response, statusCode } = handleError(error);
        return NextResponse.json(response, { status: statusCode });
      }

      // Download video from S3
      let videoBuffer: Buffer;
      try {
        const downloadTimer = logger.startTimer('s3_video_download');
        const videoResponse = await fetch(signedUrl);
        if (!videoResponse.ok) {
          throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const arrayBuffer = await videoResponse.arrayBuffer();
        videoBuffer = Buffer.from(arrayBuffer);
        logger.endTimer(downloadTimer);
        logger.info('Video downloaded successfully', {
          size: videoBuffer.length,
        });
      } catch (error) {
        logger.error('Failed to download video from S3', {
          error: error instanceof Error ? error.message : String(error),
          videoPath,
        });
        const { response, statusCode } = handleError(error);
        return NextResponse.json(response, { status: statusCode });
      }

      // Check feature flag for external AI
      const externalAIEnabled = process.env.EXTERNAL_AI_ENABLED === 'true';
      
      if (externalAIEnabled) {
        // Try external AI analysis
        try {
          logger.info('External AI enabled, attempting external analysis');
          
          // Initialize External AI Client
          const externalAIConfig = {
            apiUrl: process.env.EXTERNAL_AI_API_URL || 'http://10.59.19.205:9000/analyze/',
            timeout: parseInt(process.env.EXTERNAL_AI_TIMEOUT || '240000', 10),
            maxRetries: 3,
          };

          const externalAIClient = new ExternalAIClient(externalAIConfig);

          // Send video to external AI
          rawAnalysis = await externalAIClient.analyzeVideo(videoBuffer, 'video/mp4');
          
          logger.info('External AI analysis successful', {
            analysisType,
          });

          analysisSource = 'hybrid';

        } catch (externalError) {
          // Log fallback event with reason
          const errorMessage = externalError instanceof Error ? externalError.message : 'Unknown error';
          logger.logFallback({
            reason: errorMessage,
            originalError: errorMessage,
            fallbackMethod: 'direct_gemini',
            triggeredBy: 'external_ai_failure',
          });

          // Fall back to direct Gemini analysis
          logger.warn('External AI failed, falling back to direct Gemini', {
            error: errorMessage,
          });
          
          // For direct Gemini fallback, we'll generate feedback directly
          try {
            const feedback = await analyzeWithDirectGemini(videoBuffer, videoPath, geminiApiKey);
            analysisSource = 'gemini_direct';
            
            // Store the feedback and return
            const { data, error: dbError } = await supabaseServer
              .from('feedback_sessions')
              .insert({
                user_id: userId,
                video_path: videoPath,
                feedback_text: feedback,
                raw_analysis: null,
                analysis_source: analysisSource,
                analysis_type: analysisType,
              })
              .select('id')
              .single();

            if (dbError || !data) {
              logger.error('Failed to insert feedback into database', {
                error: dbError?.message || 'No data returned',
              });
              const errorResponse = createErrorResponse('database', dbError?.message);
              return NextResponse.json(errorResponse, { status: getStatusCode('database') });
            }

            const totalDuration = logger.endTimer(requestTimer);
            logger.info('Analysis request completed successfully (direct Gemini fallback)', {
              feedbackSessionId: data.id,
              analysisSource,
              analysisType,
              totalDuration,
            });

            return NextResponse.json({
              success: true,
              feedback,
              feedbackSessionId: data.id,
              analysisType,
              cached: false,
            });
          } catch (geminiError) {
            logger.error('Direct Gemini fallback also failed', {
              error: geminiError instanceof Error ? geminiError.message : String(geminiError),
            });
            const { response, statusCode } = handleError(geminiError);
            return NextResponse.json(response, { status: statusCode });
          }
        }
      } else {
        // External AI disabled, use direct Gemini
        logger.info('External AI disabled, using direct Gemini analysis');
        try {
          const feedback = await analyzeWithDirectGemini(videoBuffer, videoPath, geminiApiKey);
          analysisSource = 'gemini_direct';
          
          // Store the feedback and return
          const { data, error: dbError } = await supabaseServer
            .from('feedback_sessions')
            .insert({
              user_id: userId,
              video_path: videoPath,
              feedback_text: feedback,
              raw_analysis: null,
              analysis_source: analysisSource,
              analysis_type: analysisType,
            })
            .select('id')
            .single();

          if (dbError || !data) {
            logger.error('Failed to insert feedback into database', {
              error: dbError?.message || 'No data returned',
            });
            const errorResponse = createErrorResponse('database', dbError?.message);
            return NextResponse.json(errorResponse, { status: getStatusCode('database') });
          }

          const totalDuration = logger.endTimer(requestTimer);
          logger.info('Analysis request completed successfully (direct Gemini)', {
            feedbackSessionId: data.id,
            analysisSource,
            analysisType,
            totalDuration,
          });

          return NextResponse.json({
            success: true,
            feedback,
            feedbackSessionId: data.id,
            analysisType,
            cached: false,
          });
        } catch (error) {
          logger.error('Failed to analyze video with Gemini', {
            error: error instanceof Error ? error.message : String(error),
          });
          const { response, statusCode } = handleError(error);
          return NextResponse.json(response, { status: statusCode });
        }
      }
    }

    // 5. At this point, we have raw_analysis (either existing or newly generated)
    // Get appropriate prompt for the requested analysis type
    if (!rawAnalysis) {
      logger.error('No raw_analysis available after processing', {
        analysisType,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis generation failed',
          message: 'Failed to generate or retrieve raw analysis data',
        },
        { status: 500 }
      );
    }

    let feedback: string;
    try {
      const promptTimer = logger.startTimer('prompt_generation');
      const customPrompt = getPromptForAnalysis(analysisType, rawAnalysis);
      logger.endTimer(promptTimer);

      logger.info('Generated custom prompt for analysis type', {
        analysisType,
        promptLength: customPrompt.length,
      });

      // 6. Process with Gemini using custom prompt
      const geminiProcessor = new GeminiProcessor({
        apiKey: geminiApiKey,
        model: 'gemini-2.5-flash',
      });

      feedback = await geminiProcessor.processWithPrompt(rawAnalysis, customPrompt);

      logger.info('Successfully processed analysis with custom prompt', {
        analysisType,
        feedbackLength: feedback.length,
      });
    } catch (error) {
      logger.error('Failed to process analysis with custom prompt', {
        error: error instanceof Error ? error.message : String(error),
        analysisType,
      });
      const { response, statusCode } = handleError(error);
      return NextResponse.json(response, { status: statusCode });
    }

    // 7. Store new analysis in database with analysis_type field
    let feedbackSessionId: string;
    try {
      const dbTimer = logger.startTimer('database_insert');
      const { data, error: dbError } = await supabaseServer
        .from('feedback_sessions')
        .insert({
          user_id: userId,
          video_path: videoPath,
          feedback_text: feedback,
          raw_analysis: rawAnalysis, // Store JSON from external AI
          analysis_source: analysisSource, // Track which analysis method was used
          analysis_type: analysisType, // Store the specific analysis type
        })
        .select('id')
        .single();

      if (dbError || !data) {
        logger.error('Failed to insert feedback into database', {
          error: dbError?.message || 'No data returned',
          analysisType,
        });
        
        // Check if it's a unique constraint violation
        if (dbError?.code === '23505') {
          logger.warn('Duplicate analysis type detected, this should have been caught by cache check', {
            analysisType,
          });
          return NextResponse.json(
            {
              success: false,
              error: 'Duplicate analysis',
              message: 'This analysis type has already been generated for this video',
            },
            { status: 409 }
          );
        }
        
        const errorResponse = createErrorResponse('database', dbError?.message);
        return NextResponse.json(errorResponse, { status: getStatusCode('database') });
      }

      feedbackSessionId = data.id;
      logger.endTimer(dbTimer);
    } catch (error) {
      logger.error('Database operation failed', {
        error: error instanceof Error ? error.message : String(error),
        analysisType,
      });
      const { response, statusCode } = handleError(error);
      return NextResponse.json(response, { status: statusCode });
    }

    // 8. Return success response with feedback, session ID, analysis type, and cached flag
    const totalDuration = logger.endTimer(requestTimer);
    logger.info('Analysis request completed successfully', {
      feedbackSessionId,
      analysisSource,
      analysisType,
      totalDuration,
    });

    return NextResponse.json({
      success: true,
      feedback,
      feedbackSessionId,
      analysisType,
      cached: false,
    });
  } catch (error) {
    // Handle unexpected errors
    logger.error('Unexpected error in analyze route', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const { response, statusCode } = handleError(error);
    return NextResponse.json(response, { status: statusCode });
  }
}

/**
 * Helper function to analyze video directly with Gemini (fallback method)
 * @param videoBuffer - Video file as Buffer
 * @param videoPath - Path to video in S3
 * @param geminiApiKey - Gemini API key
 * @returns Feedback text from Gemini
 */
async function analyzeWithDirectGemini(
  videoBuffer: Buffer,
  videoPath: string,
  geminiApiKey: string
): Promise<string> {
  const fileManager = new GoogleAIFileManager(geminiApiKey);
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  // Write video to temp file
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `video-${Date.now()}.mp4`);

  await fs.writeFile(tempFilePath, videoBuffer);

  try {
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

    const feedback = result.response.text();

    // Clean up uploaded file from Gemini
    await fileManager.deleteFile(uploadResult.file.name);

    if (!feedback) {
      throw new Error('Gemini API returned empty feedback');
    }

    return feedback;
  } catch (error) {
    // Clean up temp file if it still exists
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}
