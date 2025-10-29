// TypeScript type definitions for the application

export type AnalysisType = 
  | 'executive_summary'      // Overall verdict and metrics
  | 'strengths_failures'     // What works and what doesn't
  | 'timewise_analysis'      // 5-second breakdown
  | 'action_fixes'           // Specific improvements
  | 'visualizations';        // Performance patterns

export interface User {
  id: string;
  email: string;
}

export interface ExternalAIAnalysis {
  // Raw JSON structure from external AI API
  // Flexible structure to accommodate various response formats
  metadata?: {
    duration?: number;
    resolution?: string;
    processingTime?: number;
  };
  analysis?: {
    speech?: {
      pace?: number;
      clarity?: number;
      fillerWords?: { word: string; count: number }[];
    };
    visual?: {
      bodyLanguage?: string;
      eyeContact?: string;
      gestures?: string;
    };
    overall?: {
      confidence?: number;
      engagement?: number;
    };
  };
  [key: string]: any; // Allow for additional fields from API
}

export interface FeedbackSession {
  id: string;
  user_id: string;
  video_path: string;
  feedback_text: string | null;
  raw_analysis?: ExternalAIAnalysis | null;
  analysis_source?: 'external_ai' | 'gemini_direct' | 'hybrid';
  analysis_type: AnalysisType;
  created_at: string;
}

export interface UploadedVideo {
  path: string;
  url: string;
  timestamp: number;
}

export interface AIModelRequest {
  videoUrl: string;
}

export interface AIModelResponse {
  feedback: string;
}
