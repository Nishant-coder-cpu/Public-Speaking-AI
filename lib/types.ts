// TypeScript type definitions for the application

export interface User {
  id: string;
  email: string;
}

export interface FeedbackSession {
  id: string;
  user_id: string;
  video_path: string;
  feedback_text: string | null;
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
