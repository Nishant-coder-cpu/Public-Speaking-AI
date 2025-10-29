-- Migration: Add multi-analysis support to feedback_sessions table
-- This migration adds the analysis_type column and creates a unique index
-- to support multiple analysis types per video

-- Add analysis_type column with default value
ALTER TABLE feedback_sessions 
ADD COLUMN IF NOT EXISTS analysis_type TEXT NOT NULL DEFAULT 'executive_summary';

-- Remove duplicate records before creating unique index
-- Keep only the most recent record for each (user_id, video_path, analysis_type) combination
DELETE FROM feedback_sessions
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, video_path, analysis_type 
             ORDER BY created_at DESC
           ) as rn
    FROM feedback_sessions
  ) t
  WHERE t.rn > 1
);

-- Create unique index to prevent duplicate analyses
-- This allows multiple records per video (one per analysis type)
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_unique_analysis 
ON feedback_sessions(user_id, video_path, analysis_type);

-- Add comment to document the column
COMMENT ON COLUMN feedback_sessions.analysis_type IS 
'Type of analysis performed: executive_summary, strengths_failures, timewise_analysis, action_fixes, or visualizations';
