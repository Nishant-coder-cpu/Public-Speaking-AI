# Requirements Document

## Introduction

This feature integrates an external AI model API endpoint for video analysis into the Personalized Speaking Coach platform. The integration will replace or augment the current direct Gemini analysis by first sending videos to a specialized video analysis model that outputs structured JSON data, which is then processed by Gemini to generate user-friendly feedback.

## Requirements

### Requirement 1: Video Analysis API Integration

**User Story:** As a user, I want my uploaded videos to be analyzed by a specialized AI model, so that I receive more accurate and structured feedback on my speaking performance.

#### Acceptance Criteria

1. WHEN a user uploads a video THEN the system SHALL send the video file to the external AI model API endpoint via POST request to `/analyze/`
2. WHEN the video is sent to the API THEN the system SHALL use multipart/form-data format with the video file
3. WHEN the API responds THEN the system SHALL receive and parse the JSON output containing structured analysis data
4. IF the API request fails THEN the system SHALL retry up to 3 times with exponential backoff
5. IF all retries fail THEN the system SHALL log the error and notify the user that analysis is temporarily unavailable

### Requirement 2: JSON Analysis Processing

**User Story:** As a developer, I want the raw JSON analysis from the AI model to be processed and enhanced by Gemini, so that users receive comprehensive, natural language feedback.

#### Acceptance Criteria

1. WHEN the AI model returns JSON analysis THEN the system SHALL validate the JSON structure before processing
2. WHEN valid JSON is received THEN the system SHALL send it to Gemini with a specialized prompt for feedback generation
3. WHEN Gemini processes the JSON THEN the system SHALL receive natural language feedback covering all aspects from the analysis
4. IF the JSON is invalid or incomplete THEN the system SHALL log the issue and fall back to direct video analysis with Gemini
5. WHEN feedback is generated THEN the system SHALL store both the raw JSON analysis and the Gemini-generated feedback in the database

### Requirement 3: Database Schema Updates

**User Story:** As a system administrator, I want to store both raw analysis data and processed feedback, so that we can track model performance and provide detailed insights.

#### Acceptance Criteria

1. WHEN a new feedback session is created THEN the system SHALL store the raw JSON analysis in a dedicated column
2. WHEN feedback is stored THEN the system SHALL maintain the existing feedback text column for Gemini's output
3. WHEN querying feedback THEN the system SHALL be able to retrieve both raw analysis and processed feedback
4. IF the database schema needs updating THEN the system SHALL provide migration scripts

### Requirement 4: Error Handling and Fallback

**User Story:** As a user, I want to receive feedback even if the external AI model is unavailable, so that my experience is not disrupted.

#### Acceptance Criteria

1. IF the external AI model API is unreachable THEN the system SHALL fall back to direct Gemini video analysis
2. WHEN using fallback mode THEN the system SHALL log the fallback event for monitoring
3. WHEN fallback occurs THEN the user SHALL still receive feedback without knowing about the technical issue
4. IF the external API returns an error status code THEN the system SHALL handle it gracefully and use fallback

### Requirement 5: API Configuration Management

**User Story:** As a developer, I want the AI model API endpoint to be configurable, so that we can easily update or change the service without code changes.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL load the AI model API URL from environment variables
2. WHEN the API URL is not configured THEN the system SHALL default to direct Gemini analysis
3. IF API authentication is required THEN the system SHALL support API key configuration via environment variables
4. WHEN configuration changes THEN the system SHALL not require code redeployment

### Requirement 6: Response Time and User Experience

**User Story:** As a user, I want to see progress updates while my video is being analyzed, so that I know the system is working.

#### Acceptance Criteria

1. WHEN video analysis begins THEN the system SHALL display a loading indicator to the user
2. WHEN the external API is processing THEN the system SHALL show status updates (e.g., "Analyzing video...", "Generating feedback...")
3. WHEN analysis completes THEN the system SHALL display the feedback within 5 seconds of receiving the Gemini response
4. IF analysis takes longer than expected THEN the system SHALL inform the user that processing is still in progress
