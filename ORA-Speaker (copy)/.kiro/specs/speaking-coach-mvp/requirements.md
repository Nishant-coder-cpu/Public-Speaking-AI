# Requirements Document

## Introduction

The Personalized Speaking Coach is a hackathon MVP that enables users to upload video recordings of their public speaking practice, receive AI-powered feedback on their performance, and track their progress over time. The system focuses on a streamlined upload-analyze-feedback flow using Next.js, Supabase, and an external AI model endpoint. The goal is to provide actionable coaching feedback on tone, pace, clarity, and delivery to help users improve their public speaking skills.

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely authenticate using email/password or Google OAuth, so that I can access my personal dashboard and keep my videos private.

#### Acceptance Criteria

1. WHEN a user visits the landing page THEN the system SHALL display login options for email/password and Google OAuth
2. WHEN a user successfully authenticates THEN the system SHALL redirect them to their personal dashboard
3. WHEN a user is not authenticated and attempts to access the dashboard THEN the system SHALL redirect them to the login page
4. IF a user is already authenticated THEN the system SHALL automatically redirect them to the dashboard when visiting the landing page

### Requirement 2: Video Upload

**User Story:** As a user, I want to upload MP4 video files of my speaking practice through a drag-and-drop interface or file picker, so that I can easily submit videos for analysis.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard THEN the system SHALL display an upload card with drag-and-drop area and file picker button
2. WHEN a user selects a file THEN the system SHALL validate that the file is in MP4 format
3. WHEN a user selects a file THEN the system SHALL validate that the file size is less than 150MB
4. IF the file format is not MP4 OR the file size exceeds 150MB THEN the system SHALL display an error message and prevent upload
5. WHEN a valid file is selected THEN the system SHALL upload it to Supabase Storage bucket "videos" with path "user_{userId}/{timestamp}.mp4"
6. WHILE the file is uploading THEN the system SHALL display a progress bar showing upload percentage
7. WHEN the upload completes successfully THEN the system SHALL display "Uploaded Successfully" message with a video preview
8. IF the upload fails THEN the system SHALL display an error message with retry option

### Requirement 3: Video Analysis Request

**User Story:** As a user, I want to request AI analysis of my uploaded video, so that I can receive personalized feedback on my speaking performance.

#### Acceptance Criteria

1. WHEN a video upload completes successfully THEN the system SHALL display an "Analyze Video" button
2. WHEN a user clicks "Analyze Video" THEN the system SHALL call the backend API endpoint /api/analyze with userId and videoPath
3. WHEN the API receives the request THEN the system SHALL create a signed URL for the video valid for 10 minutes
4. WHEN the signed URL is created THEN the system SHALL send a POST request to the AI model endpoint with the signed URL
5. WHEN the AI model returns feedback THEN the system SHALL store the feedback in the feedback_sessions table with fields: id, user_id, video_path, feedback_text, created_at
6. WHEN the feedback is stored THEN the system SHALL return the feedback text to the frontend
7. WHILE the analysis is processing THEN the system SHALL display a loading indicator
8. IF the analysis fails THEN the system SHALL display an error message with retry option

### Requirement 4: Feedback Display

**User Story:** As a user, I want to view AI-generated feedback on my speaking performance in a clear and formatted manner, so that I can understand my strengths and areas for improvement.

#### Acceptance Criteria

1. WHEN the analysis completes successfully THEN the system SHALL display a feedback card below the video preview
2. WHEN the feedback card is displayed THEN the system SHALL show a title "AI Feedback" and the feedback text from the model
3. WHEN the feedback card appears THEN the system SHALL use a smooth fade-in animation
4. WHEN the feedback is displayed THEN the system SHALL format it with proper line breaks and readability
5. WHEN feedback is displayed THEN the system SHALL provide a "Save" button for future download functionality
6. WHEN the feedback card is rendered THEN the system SHALL be responsive and readable on mobile and desktop devices

### Requirement 5: Supabase Integration

**User Story:** As a system, I need to integrate with Supabase for authentication, storage, and database operations, so that the application has a scalable backend infrastructure.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL configure Supabase client with proper credentials
2. WHEN a user authenticates THEN the system SHALL use Supabase Auth for session management
3. WHEN a video is uploaded THEN the system SHALL store it in Supabase Storage bucket named "videos"
4. WHEN feedback is generated THEN the system SHALL store it in the feedback_sessions table
5. WHEN the feedback_sessions table is queried THEN the system SHALL have columns: id (uuid, primary key), user_id (uuid, foreign key to auth.users), video_path (text), feedback_text (text), created_at (timestamptz)
6. WHEN creating signed URLs THEN the system SHALL use Supabase Storage API with appropriate expiration time

### Requirement 6: API Endpoint Implementation

**User Story:** As a system, I need a backend API endpoint to orchestrate video analysis, so that the frontend can trigger analysis and receive feedback.

#### Acceptance Criteria

1. WHEN the /api/analyze endpoint receives a POST request THEN the system SHALL expect a JSON body with userId and videoPath
2. WHEN the endpoint processes the request THEN the system SHALL validate that userId and videoPath are provided
3. WHEN validation passes THEN the system SHALL create a signed URL for the video with 10-minute expiration
4. WHEN the signed URL is created THEN the system SHALL POST to the AI model endpoint with format: { "videoUrl": "<signed_url>" }
5. WHEN the AI model responds THEN the system SHALL expect a JSON response with format: { "feedback": "..." }
6. WHEN feedback is received THEN the system SHALL insert a new record into feedback_sessions table
7. WHEN the database insert succeeds THEN the system SHALL return JSON response: { "success": true, "feedback": "..." }
8. IF any step fails THEN the system SHALL return an appropriate error response with status code and message

### Requirement 7: User Interface Design

**User Story:** As a user, I want a modern, responsive, and intuitive interface, so that I can easily navigate and use the application on any device.

#### Acceptance Criteria

1. WHEN the application renders THEN the system SHALL use Tailwind CSS for styling
2. WHEN the upload box is displayed THEN the system SHALL show a dashed border with a cloud icon
3. WHEN components are rendered THEN the system SHALL be responsive using flexbox and grid layouts
4. WHEN the user interacts with the interface THEN the system SHALL provide visual feedback (hover states, loading indicators, success/error messages)
5. WHEN the application loads THEN the system SHALL use gradient backgrounds for a modern aesthetic
6. WHEN displaying content THEN the system SHALL ensure proper spacing, typography, and visual hierarchy

### Requirement 8: Upload History (Optional)

**User Story:** As a user, I want to see my recent upload history, so that I can quickly access my previous videos and feedback.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display the last 3 uploads with timestamps
2. WHEN displaying upload history THEN the system SHALL show a short preview or thumbnail for each video
3. WHEN a user clicks on a history item THEN the system SHALL load that video and its associated feedback
4. IF there are no previous uploads THEN the system SHALL display a message encouraging the user to upload their first video
