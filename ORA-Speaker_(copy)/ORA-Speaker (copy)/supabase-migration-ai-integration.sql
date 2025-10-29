-- Migration: Add AI Model Integration columns to feedback_sessions
-- Date: 2025-10-29
-- Description: Adds raw_analysis JSONB column and analysis_source VARCHAR column
--              to support external AI model integration with fallback to Gemini

-- ============================================
-- 1. Add new columns to feedback_sessions
-- ============================================

-- Add raw_analysis column to store structured JSON from external AI
ALTER TABLE feedback_sessions
ADD COLUMN IF NOT EXISTS raw_analysis JSONB;

-- Add analysis_source column to track which AI service was used
ALTER TABLE feedback_sessions
ADD COLUMN IF NOT EXISTS analysis_source VARCHAR(50) DEFAULT 'gemini_direct';

-- ============================================
-- 2. Add comments for documentation
-- ============================================

COMMENT ON COLUMN feedback_sessions.raw_analysis IS 
  'Structured JSON analysis from external AI model API';

COMMENT ON COLUMN feedback_sessions.analysis_source IS 
  'Source of analysis: external_ai, gemini_direct, or hybrid';

-- ============================================
-- 3. Create index for analysis_source queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_feedback_sessions_analysis_source 
  ON feedback_sessions(analysis_source);

-- ============================================
-- 4. Verify migration
-- ============================================

-- Check if columns were added successfully
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'feedback_sessions'
  AND column_name IN ('raw_analysis', 'analysis_source')
ORDER BY ordinal_position;

-- ============================================
-- 5. Rollback script (if needed)
-- ============================================

-- To rollback this migration, run:
-- DROP INDEX IF EXISTS idx_feedback_sessions_analysis_source;
-- ALTER TABLE feedback_sessions DROP COLUMN IF EXISTS analysis_source;
-- ALTER TABLE feedback_sessions DROP COLUMN IF EXISTS raw_analysis;
