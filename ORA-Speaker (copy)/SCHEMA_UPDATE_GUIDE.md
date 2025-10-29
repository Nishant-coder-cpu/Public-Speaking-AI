# Schema Update Guide: Database Types and Queries

## Overview

This guide documents the TypeScript type updates and database query modifications to support the new AI model integration schema.

## Type Updates

### Updated FeedbackSession Interface

The `FeedbackSession` interface in `lib/types.ts` has been updated to include the new database columns:

```typescript
export interface FeedbackSession {
  id: string;
  user_id: string;
  video_path: string;
  feedback_text: string | null;
  raw_analysis?: ExternalAIAnalysis | null;  // NEW: Stores raw JSON from external AI
  analysis_source?: 'external_ai' | 'gemini_direct' | 'hybrid';  // NEW: Tracks AI source
  created_at: string;
}
```

### New ExternalAIAnalysis Interface

A new interface has been added to type the raw analysis data:

```typescript
export interface ExternalAIAnalysis {
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
  [key: string]: any; // Flexible for various API response formats
}
```

## Query Updates

### Insert Queries

**Location**: `app/api/analyze/route.ts`

**Before**:
```typescript
const { data, error: dbError } = await supabaseServer
  .from('feedback_sessions')
  .insert({
    user_id: userId,
    video_path: videoPath,
    feedback_text: feedback,
  })
  .select('id')
  .single();
```

**After**:
```typescript
const { data, error: dbError } = await supabaseServer
  .from('feedback_sessions')
  .insert({
    user_id: userId,
    video_path: videoPath,
    feedback_text: feedback,
    raw_analysis: null, // Will be populated when external AI is integrated
    analysis_source: 'gemini_direct', // Current implementation uses direct Gemini
  })
  .select('id')
  .single();
```

### Select Queries

**Location**: `app/dashboard/page.tsx`

The dashboard query uses `select('*')` which automatically includes all columns:

```typescript
const { data, error } = await supabase
  .from('feedback_sessions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(limit);
```

✅ **No changes needed** - The wildcard selector will automatically include the new columns.

## Backward Compatibility

### Existing Records

- ✅ Existing records will have `raw_analysis = NULL`
- ✅ Existing records will have `analysis_source = 'gemini_direct'` (default value)
- ✅ All existing queries continue to work without modification

### Optional Fields

The new fields are marked as optional in TypeScript:

```typescript
raw_analysis?: ExternalAIAnalysis | null;
analysis_source?: 'external_ai' | 'gemini_direct' | 'hybrid';
```

This ensures:
- Code can handle records with or without these fields
- No breaking changes to existing components
- Gradual migration path as external AI is integrated

### Type Safety

TypeScript will now provide:
- ✅ Autocomplete for new fields
- ✅ Type checking for analysis_source values
- ✅ Proper typing for raw_analysis JSON structure
- ✅ Compile-time errors if fields are misused

## Usage Examples

### Inserting with External AI Data

```typescript
const { data, error } = await supabaseServer
  .from('feedback_sessions')
  .insert({
    user_id: userId,
    video_path: videoPath,
    feedback_text: processedFeedback,
    raw_analysis: {
      metadata: { duration: 120, resolution: '1080p' },
      analysis: {
        speech: { pace: 150, clarity: 0.85 },
        overall: { confidence: 0.78 }
      }
    },
    analysis_source: 'external_ai',
  })
  .select()
  .single();
```

### Querying with Type Safety

```typescript
const { data, error } = await supabase
  .from('feedback_sessions')
  .select('*')
  .eq('user_id', userId)
  .returns<FeedbackSession[]>();

if (data) {
  data.forEach(session => {
    // TypeScript knows about all fields
    console.log(session.analysis_source); // 'external_ai' | 'gemini_direct' | 'hybrid'
    
    if (session.raw_analysis) {
      // Access raw analysis data with type safety
      console.log(session.raw_analysis.analysis?.speech?.pace);
    }
  });
}
```

### Filtering by Analysis Source

```typescript
// Get only external AI analyzed sessions
const { data, error } = await supabase
  .from('feedback_sessions')
  .select('*')
  .eq('user_id', userId)
  .eq('analysis_source', 'external_ai')
  .order('created_at', { ascending: false });
```

### Handling Null Values

```typescript
function displayAnalysis(session: FeedbackSession) {
  // Safe access with optional chaining
  const pace = session.raw_analysis?.analysis?.speech?.pace;
  
  if (pace) {
    console.log(`Speaking pace: ${pace} words per minute`);
  } else {
    console.log('No detailed analysis available');
  }
}
```

## Migration Checklist

- [x] Update TypeScript types in `lib/types.ts`
- [x] Update insert queries to include new columns
- [x] Verify select queries work with new schema
- [x] Ensure backward compatibility with existing records
- [x] Add type safety for new fields
- [ ] Run database migration (see MIGRATION_GUIDE.md)
- [ ] Test queries with new schema
- [ ] Update components to display new data (future task)

## Testing

### Verify Type Safety

```bash
# Check for TypeScript errors
npm run build
```

### Test Database Operations

```bash
# Run migration test script
node test-migration.js
```

### Manual Testing

1. Insert a new feedback session via the analyze API
2. Verify the record has `analysis_source = 'gemini_direct'`
3. Verify the record has `raw_analysis = NULL`
4. Query the record from the dashboard
5. Confirm no errors and data displays correctly

## Next Steps

After completing this task:

1. **Task 5**: Refactor analyze API route to integrate external AI client
2. **Task 6**: Enhance error handling and logging
3. **Task 7**: Update frontend to display analysis source and raw data
4. **Task 9**: Integration testing with actual external AI

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about missing properties:

```typescript
// Add type assertion if needed
const session = data as FeedbackSession;
```

### Database Errors

If insert queries fail:

1. Verify migration has been run
2. Check column names match exactly
3. Verify data types are correct
4. Check RLS policies allow the operation

### Null Handling

If you encounter null reference errors:

```typescript
// Always use optional chaining
const value = session.raw_analysis?.analysis?.speech?.pace ?? 0;
```

## References

- [Supabase TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [PostgreSQL JSONB Type](https://www.postgresql.org/docs/current/datatype-json.html)
- [TypeScript Optional Properties](https://www.typescriptlang.org/docs/handbook/2/objects.html#optional-properties)
