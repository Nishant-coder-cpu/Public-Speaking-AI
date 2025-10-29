# Implementation Plan

- [x] 1. Set up environment configuration and types

  - Add new environment variables to `.env.local.example` (EXTERNAL_AI_API_URL, EXTERNAL_AI_API_KEY, EXTERNAL_AI_TIMEOUT, EXTERNAL_AI_ENABLED)
  - Update `lib/types.ts` with ExternalAIAnalysis interface and updated FeedbackSession type
  - Create configuration validation utility to check required environment variables
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Implement External AI Client

  - [x] 2.1 Create `lib/externalAIClient.ts` with ExternalAIClient class

    - Implement constructor with configuration (apiUrl, apiKey, timeout, maxRetries)
    - Implement `analyzeVideo()` method to send video buffer via multipart/form-data POST
    - Implement `healthCheck()` method to verify API availability
    - _Requirements: 1.1, 1.2, 1.3, 5.1_

  - [x] 2.2 Add retry logic with exponential backoff

    - Create `withRetry()` utility function for automatic retries
    - Implement exponential backoff (1s, 2s, 4s delays)
    - Handle timeout errors and network failures
    - _Requirements: 1.4, 4.1_

  - [x] 2.3 Add response validation and error handling
    - Validate JSON structure from API response
    - Handle malformed responses gracefully
    - Log all API interactions with timestamps and status codes
    - _Requirements: 2.1, 4.2, 4.3_

- [x] 3. Implement Gemini JSON Processor

  - [x] 3.1 Create `lib/geminiProcessor.ts` with GeminiProcessor class

    - Implement constructor with Gemini API configuration
    - Create specialized prompt template for JSON-to-feedback conversion
    - Implement `processFeedback()` method to convert JSON analysis to natural language
    - _Requirements: 2.2, 2.3_

  - [x] 3.2 Add fallback handling for invalid JSON
    - Detect incomplete or invalid JSON structures
    - Log fallback events for monitoring
    - Return appropriate error messages
    - _Requirements: 2.4, 4.1, 4.2_

- [x] 4. Update database schema

  - [x] 4.1 Create database migration script

    - Write SQL migration to add `raw_analysis` JSONB column
    - Add `analysis_source` VARCHAR column with default value
    - Test migration on local database
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 4.2 Update Supabase types and queries
    - Update TypeScript types to match new schema
    - Modify insert queries to include new columns
    - Ensure backward compatibility with existing records
    - _Requirements: 3.3_

- [x] 5. Refactor analyze API route

  - [x] 5.1 Integrate External AI Client into analyze route

    - Import and initialize ExternalAIClient with environment config
    - Add external AI analysis step after video download
    - Capture and store JSON response
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Integrate Gemini Processor for JSON conversion

    - Initialize GeminiProcessor
    - Pass JSON analysis to processor when external AI succeeds
    - Store both raw JSON and processed feedback in database
    - _Requirements: 2.2, 2.3, 2.5_

  - [x] 5.3 Implement fallback logic

    - Wrap external AI call in try-catch
    - Fall back to direct Gemini analysis on external API failure
    - Log fallback events with reason codes
    - Set appropriate `analysis_source` value in database
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.4 Add feature flag support
    - Check EXTERNAL_AI_ENABLED environment variable
    - Skip external AI if flag is false
    - Default to direct Gemini when disabled
    - _Requirements: 5.2_

- [x] 6. Enhance error handling and logging

  - [x] 6.1 Add structured error logging

    - Log external API request/response details
    - Log fallback triggers with context
    - Log processing times for performance monitoring
    - _Requirements: 1.5, 4.2_

  - [x] 6.2 Improve user-facing error messages
    - Return consistent error format to frontend
    - Provide helpful messages without exposing internal details
    - Handle timeout scenarios gracefully
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Update frontend for better UX

  - [x] 7.1 Add progress indicators during analysis

    - Show "Analyzing video..." status message
    - Display "Generating feedback..." when processing with Gemini
    - Update loading states in UploadBox component
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Handle longer processing times
    - Increase timeout expectations in frontend
    - Show progress updates if analysis takes longer than expected
    - Display completion message when feedback is ready
    - _Requirements: 6.3, 6.4_

- [ ]\* 8. Write unit tests

  - Test ExternalAIClient with mocked fetch responses
  - Test retry logic with simulated failures
  - Test GeminiProcessor with sample JSON inputs
  - Test analyze API route with mocked dependencies
  - Test fallback logic triggers correctly
  - _Requirements: All_

- [ ] 9. Integration testing and validation

  - [ ] 9.1 Test end-to-end flow with actual external API

    - Upload test video and verify external AI is called
    - Confirm JSON response is stored in database
    - Validate Gemini generates appropriate feedback from JSON
    - Check feedback quality and format
    - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.5_

  - [ ] 9.2 Test fallback scenarios

    - Simulate external API downtime (stop service or use invalid URL)
    - Verify system falls back to direct Gemini analysis
    - Confirm user still receives feedback
    - Check logs show fallback was triggered
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 9.3 Test with various video formats and sizes
    - Test with small videos (< 1 MB)
    - Test with medium videos (5-50 MB)
    - Test with large videos (100-250 MB)
    - Verify timeout handling for long-running analyses
    - _Requirements: 1.1, 1.2, 6.3, 6.4_

- [ ] 10. Documentation and deployment preparation

  - [ ] 10.1 Update documentation

    - Document new environment variables in README
    - Add architecture diagram to docs
    - Document fallback behavior for team
    - Create troubleshooting guide
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 10.2 Prepare deployment checklist
    - Verify all environment variables are set
    - Test database migration in staging
    - Confirm external API endpoint is accessible from production
    - Create rollback plan if issues arise
    - _Requirements: All_
