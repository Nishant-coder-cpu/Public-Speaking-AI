import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExternalAIAnalysis } from '@/lib/types';
import { createLogger } from './logger';

/**
 * Configuration for GeminiProcessor
 */
export interface GeminiProcessorConfig {
  apiKey: string;
  model?: string;
}

/**
 * Optional metadata about the video being analyzed
 */
export interface VideoMetadata {
  duration?: number;
  fileName?: string;
}

/**
 * GeminiProcessor converts structured JSON analysis from external AI
 * into natural language feedback for users
 */
export class GeminiProcessor {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private logger = createLogger('GeminiProcessor');

  constructor(config: GeminiProcessorConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.5-flash';
  }

  /**
   * Process JSON analysis and generate user-friendly feedback
   * @param jsonAnalysis - Structured analysis from external AI
   * @param videoMetadata - Optional video metadata for context
   * @returns Natural language feedback text
   * @throws Error if JSON is invalid or processing fails
   */
  async processFeedback(
    jsonAnalysis: ExternalAIAnalysis,
    videoMetadata?: VideoMetadata
  ): Promise<string> {
    const timer = this.logger.startTimer('gemini_json_processing');

    // Detect incomplete or invalid JSON structures
    const validationResult = this.validateJsonStructure(jsonAnalysis);
    if (!validationResult.isValid) {
      // Log fallback event for monitoring
      this.logger.warn('Invalid JSON structure detected', {
        reason: validationResult.reason,
        jsonAnalysisKeys: jsonAnalysis ? Object.keys(jsonAnalysis) : [],
      });

      // Return appropriate error message
      throw new Error(`Invalid JSON analysis: ${validationResult.reason}`);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      // Build context string from metadata if available
      let contextString = '';
      if (videoMetadata) {
        const parts: string[] = [];
        if (videoMetadata.fileName) {
          parts.push(`Video: ${videoMetadata.fileName}`);
        }
        if (videoMetadata.duration) {
          parts.push(`Duration: ${Math.round(videoMetadata.duration)}s`);
        }
        if (parts.length > 0) {
          contextString = `\n\nVideo Context:\n${parts.join('\n')}`;
        }
      }

      // Create specialized prompt for JSON-to-feedback conversion
      const prompt = `You are a professional speaking coach. You have received detailed analysis data from a video analysis system. 
Convert this technical analysis into warm, constructive feedback for the speaker.${contextString}

Analysis Data:
${JSON.stringify(jsonAnalysis, null, 2)}

Provide feedback in the following format:
- **Strengths**: Highlight 2-3 specific positive observations from the data
- **Areas for Improvement**: Provide 2-3 actionable suggestions based on the analysis
- **Overall Assessment**: Brief encouraging summary

Be specific, reference the data points, and maintain an encouraging tone. Focus on actionable insights that will help the speaker improve.`;

      const result = await model.generateContent(prompt);
      const feedback = result.response.text();

      if (!feedback || feedback.trim().length === 0) {
        // Log fallback event for monitoring
        this.logger.error('Empty feedback received from Gemini', {
          jsonAnalysisKeys: Object.keys(jsonAnalysis),
        });
        throw new Error('Gemini returned empty feedback');
      }

      this.logger.endTimer(timer);
      this.logger.info('Successfully processed JSON to feedback', {
        feedbackLength: feedback.length,
        jsonKeys: Object.keys(jsonAnalysis),
      });

      return feedback;
    } catch (error) {
      // Log the error for monitoring
      this.logger.error('Failed to process feedback', {
        error: error instanceof Error ? error.message : String(error),
        jsonAnalysisKeys: jsonAnalysis ? Object.keys(jsonAnalysis) : [],
      });

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to process feedback with Gemini: ${error.message}`);
      }
      throw new Error('Failed to process feedback with Gemini: Unknown error');
    }
  }

  /**
   * Process JSON data with a custom prompt
   * @param jsonData - Raw JSON data to be processed
   * @param customPrompt - Custom prompt template to use
   * @returns Natural language feedback text
   * @throws Error if processing fails or response is empty
   */
  async processWithPrompt(
    jsonData: any,
    customPrompt: string
  ): Promise<string> {
    const timer = this.logger.startTimer('gemini_custom_prompt_processing');

    // Validate JSON structure
    const validationResult = this.validateJsonStructure(jsonData);
    if (!validationResult.isValid) {
      this.logger.warn('Invalid JSON structure detected', {
        reason: validationResult.reason,
        jsonDataKeys: jsonData ? Object.keys(jsonData) : [],
      });
      throw new Error(`Invalid JSON data: ${validationResult.reason}`);
    }

    // Validate custom prompt
    if (!customPrompt || customPrompt.trim().length === 0) {
      this.logger.error('Empty custom prompt provided');
      throw new Error('Custom prompt cannot be empty');
    }

    try {
      // Check if this is a visualization request (prompt contains JSON output instructions)
      const isVisualizationRequest = customPrompt.includes('mismatchTimeline') &&
        customPrompt.includes('energyFusion') &&
        customPrompt.includes('opportunityMap');

      // For visualization requests, use JSON response mode
      const modelConfig: any = { model: this.model };
      if (isVisualizationRequest) {
        modelConfig.generationConfig = {
          responseMimeType: 'application/json',
        };
        this.logger.info('Using JSON response mode for visualization request');
      }

      const model = this.genAI.getGenerativeModel(modelConfig);

      // Use the custom prompt directly (it should already have JSON data injected)
      const result = await model.generateContent(customPrompt);
      const feedback = result.response.text();

      // Check for empty response
      if (!feedback || feedback.trim().length === 0) {
        this.logger.error('Empty feedback received from Gemini', {
          jsonDataKeys: Object.keys(jsonData),
          promptLength: customPrompt.length,
        });
        throw new Error('Gemini returned empty feedback');
      }

      this.logger.endTimer(timer);
      this.logger.info('Successfully processed custom prompt', {
        feedbackLength: feedback.length,
        jsonKeys: Object.keys(jsonData),
        promptLength: customPrompt.length,
      });

      return feedback;
    } catch (error) {
      this.logger.error('Failed to process custom prompt', {
        error: error instanceof Error ? error.message : String(error),
        jsonDataKeys: jsonData ? Object.keys(jsonData) : [],
        promptLength: customPrompt.length,
      });

      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to process custom prompt with Gemini: ${error.message}`);
      }
      throw new Error('Failed to process custom prompt with Gemini: Unknown error');
    }
  }

  /**
   * Validate JSON structure and detect incomplete or invalid data
   * @param jsonAnalysis - JSON to validate
   * @returns Validation result with reason if invalid
   */
  private validateJsonStructure(jsonAnalysis: any): {
    isValid: boolean;
    reason?: string;
  } {
    // Check if it's null or undefined
    if (!jsonAnalysis) {
      return { isValid: false, reason: 'JSON is null or undefined' };
    }

    // Check if it's an object
    if (typeof jsonAnalysis !== 'object') {
      return { isValid: false, reason: 'JSON is not an object' };
    }

    // Check if it's an array (arrays are objects in JS)
    if (Array.isArray(jsonAnalysis)) {
      return { isValid: false, reason: 'JSON is an array, expected object' };
    }

    // Check if it's an empty object
    if (Object.keys(jsonAnalysis).length === 0) {
      return { isValid: false, reason: 'JSON is an empty object' };
    }

    // Check for circular references (would cause JSON.stringify to fail)
    try {
      JSON.stringify(jsonAnalysis);
    } catch (error) {
      return {
        isValid: false,
        reason: 'JSON contains circular references or non-serializable data',
      };
    }

    // All checks passed
    return { isValid: true };
  }

  /**
   * Validate if JSON structure is complete and usable
   * @param jsonAnalysis - JSON to validate
   * @returns true if valid, false otherwise
   */
  static isValidAnalysis(jsonAnalysis: any): jsonAnalysis is ExternalAIAnalysis {
    // Check if it's an object
    if (!jsonAnalysis || typeof jsonAnalysis !== 'object') {
      return false;
    }

    // Check if it's not an empty object
    if (Object.keys(jsonAnalysis).length === 0) {
      return false;
    }

    // Check if it's not an array (arrays are objects in JS)
    if (Array.isArray(jsonAnalysis)) {
      return false;
    }

    // If it has expected structure, validate deeper
    if ('analysis' in jsonAnalysis) {
      const analysis = jsonAnalysis.analysis;
      if (analysis && typeof analysis === 'object') {
        // Has analysis object, consider it valid
        return true;
      }
    }

    // If it has metadata, it's likely valid
    if ('metadata' in jsonAnalysis) {
      return true;
    }

    // If it has any other properties, consider it potentially valid
    // (external API might have different structure)
    return true;
  }
}
