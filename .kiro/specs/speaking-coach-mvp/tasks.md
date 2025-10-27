# Implementation Plan

- [x] 1. Initialize Next.js project and configure dependencies

  - Create Next.js 14+ project with TypeScript and App Router
  - Install and configure Tailwind CSS
  - Install Supabase client libraries (@supabase/supabase-js, @supabase/auth-helpers-nextjs)
  - Set up environment variables structure (.env.local.example)
  - Configure TypeScript with strict mode

  - _Requirements: 5.1, 7.1_

- [x] 2. Set up Supabase backend infrastructure

  - Create Supabase project and obtain credentials
  - Create `videos` storage bucket with private access
  - Create `feedback_sessions` table with schema (id, user_id, video_path, feedback_text, created_at)
  - Configure Row Level Security policies for feedback_sessions table
  - Configure storage policies for videos bucket (user-specific access)
  - Enable email/password and Google OAuth in Supabase Auth settings
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 3. Create Supabase client utilities and type definitions

  - Create `/lib/supabaseClient.ts` for client-side operations
  - Create `/lib/supabaseServer.ts` for server-side operations with service role key
  - Create `/lib/types.ts` with TypeScript interfaces (User, FeedbackSession, UploadedVideo, AIModelRequest, AIModelResponse)
  - Create `/utils/validation.ts` with file validation functions (validateFile for MP4 and size checks)
  - _Requirements: 5.1, 2.2, 2.3_

- [x] 4. Implement authentication landing page

  - Create `/app/page.tsx` with hero section and login/signup forms
  - Implement email/password authentication using Supabase Auth
  - Add Google OAuth button and integration
  - Add redirect logic to dashboard for authenticated users
  - Add error handling for invalid credentials
  - Style with Tailwind CSS (gradient backgrounds, responsive layout)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.2, 7.4, 7.5_

- [ ] 5. Create protected dashboard layout with authentication guard

  - Create `/app/dashboard/page.tsx` with authentication check
  - Implement redirect to login for unauthenticated users
  - Set up dashboard state management (uploadedVideo, isUploading, uploadProgress, isAnalyzing, feedback, error)
  - Create basic dashboard layout with header and main content area
  - Add logout functionality
  - _Requirements: 1.3, 2.1_

- [ ] 6. Build UploadBox component with drag-and-drop functionality

  - Create `/components/UploadBox.tsx` with TypeScript props interface
  - Implement drag-and-drop zone with visual feedback (border color changes)
  - Add file picker button as alternative to drag-and-drop
  - Implement file validation (MP4 format check, 150MB size limit)
  - Display validation error messages for invalid files
  - Style with Tailwind CSS (dashed border, cloud icon, hover states)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.2, 7.4_

- [ ] 7. Implement video upload to Supabase Storage with progress tracking

  - Integrate Supabase Storage upload in UploadBox component
  - Generate upload path: `user_{userId}/{timestamp}.mp4`
  - Implement progress bar component with percentage display
  - Handle upload completion and emit onUploadComplete event with videoPath and videoUrl
  - Handle upload errors and emit onError event
  - Display "Uploaded Successfully" message on completion
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 7.4_

- [ ] 8. Configure Tailwind animations and design system

  - Add fade-in animation keyframes to tailwind.config.ts
  - Configure color palette (indigo/blue gradients, success green, error red)
  - Set up typography scale and font settings
  - Configure spacing utilities
  - Test responsive breakpoints
  - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_

- [ ] 9. Create VideoPreview component

  - Create `/components/VideoPreview.tsx` with TypeScript props interface
  - Implement HTML5 video player with controls
  - Add responsive sizing for mobile and desktop
  - Add fallback message for unsupported formats
  - Style with Tailwind CSS (rounded corners, shadow)
  - _Requirements: 2.7, 7.3_

- [ ] 10. Create FeedbackCard component

  - Create `/components/FeedbackCard.tsx` with TypeScript props interface
  - Display "AI Feedback" title and feedback text
  - Format feedback text with proper line breaks and readability
  - Add fade-in animation using Tailwind CSS (animate-fade-in class)
  - Add optional "Save" button (placeholder for future functionality)
  - Make component responsive for mobile and desktop
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.3, 7.4_

- [ ] 11. Integrate VideoPreview and FeedbackCard into dashboard

  - Update dashboard to display VideoPreview component after successful upload
  - Update dashboard to display FeedbackCard component when feedback is available
  - Remove placeholder sections and integrate actual components
  - Ensure proper state management and component communication
  - _Requirements: 2.7, 4.1, 7.3_

- [ ] 12. Implement /api/analyze endpoint

  - Create `/app/api/analyze/route.ts` with POST handler
  - Parse and validate request body (userId, videoPath)
  - Create signed URL from Supabase Storage with 10-minute expiration
  - Implement POST request to AI model endpoint with signed video URL
  - Parse AI model response to extract feedback text
  - Insert feedback record into feedback_sessions table with user_id, video_path, feedback_text
  - Return success response with feedback text to client
  - Implement comprehensive error handling for missing fields, invalid requests, AI service failures, and database errors
  - Return appropriate error responses (400, 401, 500, 503)
  - _Requirements: 3.2, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 13. Add AI model endpoint configuration

  - Add AI_MODEL_ENDPOINT to .env.local.example
  - Document the expected AI model request/response format
  - Add error handling for missing environment variable
  - _Requirements: 3.4, 6.4_

- [ ] 14. Integrate analysis flow in dashboard

  - Add "Analyze Video" button that appears after successful upload
  - Implement onClick handler to call /api/analyze endpoint with userId and videoPath
  - Display loading indicator while analysis is processing
  - Update dashboard state with feedback on success
  - Handle analysis errors and display error messages
  - Disable analyze button while analysis is in progress
  - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 4.1_

- [ ] 15. Enhance error handling and user feedback

  - Improve error message display for upload failures (already partially implemented)
  - Add error messages for analysis failures
  - Add session expiration handling with redirect to login
  - Add network timeout handling for API calls
  - Consider adding toast notification system for better UX
  - _Requirements: 2.8, 3.8, 7.4_

- [ ]\* 16. Add upload history component (optional feature)

  - Create `/components/UploadHistory.tsx` component
  - Query last 3 feedback_sessions from database for current user
  - Display list with timestamps and video thumbnails/previews
  - Implement click handler to load selected video and feedback
  - Display empty state message when no uploads exist
  - Integrate into dashboard layout
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 17. Deploy to Vercel and configure production environment
  - Connect GitHub repository to Vercel
  - Configure environment variables in Vercel dashboard (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, AI_MODEL_ENDPOINT)
  - Set up automatic deployments on push to main branch
  - Verify Supabase connection in production
  - Test authentication flow in production (email/password and Google OAuth)
  - Test complete upload-analyze-feedback flow in production
  - _Requirements: All requirements (end-to-end validation)_
