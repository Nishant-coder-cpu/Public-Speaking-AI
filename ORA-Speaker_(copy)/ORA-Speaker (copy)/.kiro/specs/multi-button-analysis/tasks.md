# Implementation Plan

- [x] 1. Set up database schema and type definitions

  - Run database migration to add `analysis_type` column with default value 'executive_summary'
  - Create unique index on (user_id, video_path, analysis_type) to prevent duplicate analyses
  - Update `lib/types.ts` to add `AnalysisType` enum with 5 analysis types
  - Update `FeedbackSession` interface to include `analysis_type` field
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Create analysis prompts configuration module

  - Create `lib/analysisPrompts.ts` file with `AnalysisType` type definition
  - Define `ANALYSIS_PROMPTS` object with all 5 specialized prompt templates (executive_summary, strengths_failures, timewise_analysis, action_fixes, visualizations)
  - Implement `getPromptForAnalysis()` function that injects JSON data into prompt template
  - Define `ANALYSIS_LABELS` object with human-readable labels and descriptions for each analysis type
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Enhance Gemini processor with custom prompt support

  - Add `processWithPrompt()` method to `lib/geminiProcessor.ts` that accepts jsonData and customPrompt parameters
  - Implement method to call Gemini API with custom prompt instead of hardcoded feedback prompt
  - Add error handling for empty responses from Gemini
  - Maintain existing logging and validation logic
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [x] 4. Update analyze API route with caching and analysis type logic

  - Update request body interface to include `analysisType: AnalysisType` parameter
  - Add validation to ensure `analysisType` is one of the 5 valid types
  - Implement cache check: query database for existing (user_id, video_path, analysis_type) record
  - If cache hit: return cached feedback immediately with `cached: true` flag
  - If cache miss: check for any existing analysis to retrieve `raw_analysis` JSON
  - If no `raw_analysis` exists: call external AI to generate it
  - Get appropriate prompt using `getPromptForAnalysis(analysisType, rawAnalysis)`
  - Process with Gemini using `processWithPrompt(rawAnalysis, prompt)`
  - Store new analysis in database with `analysis_type` field
  - Return response with feedback, feedbackSessionId, analysisType, and cached flag
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5. Create reusable AnalysisButton component

  - Create `components/AnalysisButton.tsx` with props interface (type, label, icon, description, onClick, loading, completed, active)
  - Implement default state styling (white/20 border, white/5 background)
  - Implement loading state with spinner icon and "Analyzing..." text
  - Implement completed state with green checkmark icon
  - Implement active state with blue border and shadow
  - Add hover animations (scale 1.02) and tap animations (scale 0.98)
  - Add focus ring for accessibility (2px blue-400 with offset)
  - Ensure minimum height of 140px and proper touch target size (44px)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Update dashboard page with button grid and state management

  - Add state variables: `analysisResults`, `loadingStates`, `completedAnalyses`, `activeAnalysisType`
  - Implement `handleAnalyze()` function that checks for cached results in state before making API call
  - If result exists in state: set as active and display immediately
  - If result doesn't exist: set loading state, call API with analysisType, store result, mark as completed
  - Create button grid section that displays after video upload and before feedback
  - Add 5 AnalysisButton components with appropriate icons (BarChart3, Scale, Clock, Wrench, TrendingUp)
  - Implement responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
  - Add conditional rendering to show active analysis feedback below button grid
  - Add smooth animations for button grid and feedback card appearance
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Update FeedbackCard component with analysis type display

  - Add `analysisType` and `analysisLabel` props to FeedbackCard interface
  - Update header to display `analysisLabel` instead of generic "AI Feedback"
  - Add fallback to "AI Feedback" if no label is provided
  - Maintain existing styling, animations, and section parsing logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Test and validate multi-button analysis system
  - Test uploading video and verifying 5 analysis buttons appear
  - Test clicking each button and verifying unique feedback is generated
  - Test clicking same button twice and verifying instant cached response
  - Test switching between completed analyses and verifying instant display
  - Test responsive grid layout on mobile, tablet, and desktop screen sizes
  - Verify all visual states work correctly (default, loading, completed, active, hover)
  - Test error handling by simulating API failures
  - Verify database stores multiple analysis types for same video
  - Verify unique constraint prevents duplicate analysis_type records
  - Test accessibility features (keyboard navigation, focus rings, screen readers)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_
