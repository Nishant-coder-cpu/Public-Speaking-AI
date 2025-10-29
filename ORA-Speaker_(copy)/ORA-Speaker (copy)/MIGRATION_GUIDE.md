# Database Migration Guide: AI Model Integration

## Overview

This migration adds support for storing raw AI analysis data and tracking the analysis source in the `feedback_sessions` table.

## Changes

### New Columns

1. **raw_analysis** (JSONB, nullable)
   - Stores structured JSON analysis from external AI model API
   - Allows querying and analyzing raw AI output
   - NULL for existing records and when using direct Gemini analysis

2. **analysis_source** (VARCHAR(50), default: 'gemini_direct')
   - Tracks which AI service generated the feedback
   - Possible values:
     - `external_ai`: External AI model was used successfully
     - `gemini_direct`: Direct Gemini analysis (fallback or default)
     - `hybrid`: Both external AI and Gemini were used

### New Index

- `idx_feedback_sessions_analysis_source`: Improves query performance when filtering by analysis source

## Running the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase-migration-ai-integration.sql`
5. Paste into the editor
6. Click **Run** to execute the migration
7. Verify the output shows successful column additions

### Option 2: Supabase CLI (Local Development)

```bash
# If using Supabase CLI locally
supabase db push
```

### Option 3: Direct PostgreSQL Connection

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i supabase-migration-ai-integration.sql
```

## Verification

After running the migration, verify the changes:

```sql
-- Check new columns exist
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'feedback_sessions'
  AND column_name IN ('raw_analysis', 'analysis_source')
ORDER BY ordinal_position;

-- Check index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'feedback_sessions'
  AND indexname = 'idx_feedback_sessions_analysis_source';

-- Verify existing records have default values
SELECT 
  id,
  analysis_source,
  raw_analysis IS NULL as raw_analysis_is_null
FROM feedback_sessions
LIMIT 5;
```

Expected results:
- `raw_analysis` column exists with type `jsonb`
- `analysis_source` column exists with type `character varying(50)` and default `'gemini_direct'`
- Index `idx_feedback_sessions_analysis_source` exists
- Existing records have `analysis_source = 'gemini_direct'` and `raw_analysis = NULL`

## Backward Compatibility

This migration is **fully backward compatible**:

- ✅ Existing records remain unchanged
- ✅ Existing queries continue to work
- ✅ New columns are nullable or have defaults
- ✅ No breaking changes to application code

## Rollback

If you need to rollback this migration:

```sql
-- Remove the changes
DROP INDEX IF EXISTS idx_feedback_sessions_analysis_source;
ALTER TABLE feedback_sessions DROP COLUMN IF EXISTS analysis_source;
ALTER TABLE feedback_sessions DROP COLUMN IF EXISTS raw_analysis;
```

⚠️ **Warning**: Rolling back will permanently delete any data stored in these columns.

## Testing Checklist

- [ ] Migration runs without errors
- [ ] New columns appear in table schema
- [ ] Index is created successfully
- [ ] Existing records have default `analysis_source` value
- [ ] Application can insert records with new columns
- [ ] Application can query records with new columns
- [ ] RLS policies still work correctly

## Next Steps

After successful migration:

1. Update TypeScript types in `lib/types.ts` (see task 4.2)
2. Update database insert queries to include new columns
3. Test the full AI integration flow
4. Monitor the `analysis_source` column to track AI service usage
