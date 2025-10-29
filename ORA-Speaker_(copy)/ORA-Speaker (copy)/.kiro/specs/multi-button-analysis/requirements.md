# Requirements Document

## Introduction

This feature transforms the single-analysis feedback system into a multi-view analysis platform where users can generate five distinct types of AI-powered feedback from a single video upload. Each analysis type uses specialized prompts that process structured JSON data from the external AI model, providing users with comprehensive insights from different perspectives: executive summary, strengths & failures, time-aligned analysis, actionable fixes, and performance visualizations.

## Requirements

### Requirement 1: Multiple Analysis Type Support

**User Story:** As a user, I want to choose from different types of analysis for my video, so that I can focus on specific aspects of my presentation that matter most to me.

#### Acceptance Criteria

1. WHEN a user uploads a video THEN the system SHALL display 5 distinct analysis buttons: Executive Summary (A), Strengths & Failures (C), Timewise Analysis (D), Action Fixes (E), and Visualizations (VIS)
2. WHEN a user clicks any analysis button THEN the system SHALL generate feedback specific to that analysis type
3. WHEN an analysis is generated THEN the system SHALL allow the user to switch between different analysis types without re-uploading the video
4. IF a user clicks a button for an already-generated analysis THEN the system SHALL display the cached result instantly
5. WHEN multiple analyses are generated THEN the system SHALL maintain all results in memory for quick switching

### Requirement 2: Specialized Analysis Prompts

**User Story:** As a user, I want each analysis type to provide unique insights, so that I receive comprehensive feedback covering different aspects of my presentation.

#### Acceptance Criteria

1. WHEN Executive Summary (A) is requested THEN the system SHALL generate a delivery verdict, quantitative highlights (WPM, fillers, pitch, energy), and a big-picture interpretation
2. WHEN Strengths & Failures (C) is requested THEN the system SHALL identify top strengths and failure zones by fusing audio and video data with motivating but honest tone
3. WHEN Timewise Analysis (D) is requested THEN the system SHALL provide 5-second window breakdowns with timestamp ranges, transcript summaries, and audio-visual alignment analysis
4. WHEN Action Fixes (E) is requested THEN the system SHALL generate specific, actionable recommendations mapped to detected failure types without generic advice
5. WHEN Visualizations (VIS) is requested THEN the system SHALL describe three performance visualizations: mismatch timeline, energy vs intensity over time, and expected vs actual impact gap
6. WHEN any analysis is generated THEN the system SHALL use the exact prompt template defined for that analysis type

### Requirement 3: Analysis Caching and Deduplication

**User Story:** As a user, I want my analysis results to be saved so that I don't have to wait for regeneration when switching between analysis types.

#### Acceptance Criteria

1. WHEN an analysis is generated THEN the system SHALL store it in the database with the specific analysis_type identifier
2. WHEN a user requests an analysis THEN the system SHALL first check if that analysis type already exists for the video
3. IF a cached analysis exists THEN the system SHALL return it immediately without calling the AI model
4. WHEN storing analyses THEN the system SHALL enforce uniqueness on (user_id, video_path, analysis_type) to prevent duplicates
5. WHEN multiple analysis types exist for one video THEN the system SHALL allow all types to coexist in the database

### Requirement 4: Raw Analysis JSON Reuse

**User Story:** As a system, I want to reuse the raw external AI analysis JSON across all analysis types, so that we minimize external API calls and reduce processing time.

#### Acceptance Criteria

1. WHEN the first analysis is requested for a video THEN the system SHALL call the external AI API to generate raw_analysis JSON
2. WHEN subsequent analysis types are requested for the same video THEN the system SHALL reuse the existing raw_analysis JSON
3. IF no raw_analysis exists for any analysis type THEN the system SHALL generate it before processing the requested analysis
4. WHEN storing any analysis THEN the system SHALL include the raw_analysis JSON in the database record
5. WHEN retrieving raw_analysis THEN the system SHALL query any existing analysis type for that video to obtain the JSON

### Requirement 5: Database Schema for Multi-Analysis

**User Story:** As a system administrator, I want the database to support multiple analysis types per video, so that users can generate and retrieve different analyses independently.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the system SHALL add an analysis_type column with TEXT type and default value 'executive_summary'
2. WHEN the schema is updated THEN the system SHALL create a unique index on (user_id, video_path, analysis_type)
3. WHEN a new analysis is inserted THEN the system SHALL allow multiple records for the same video with different analysis_type values
4. IF a duplicate (user_id, video_path, analysis_type) is inserted THEN the database SHALL reject it with a unique constraint violation
5. WHEN querying analyses THEN the system SHALL be able to filter by analysis_type to retrieve specific analysis results

### Requirement 6: Interactive Button UI with State Management

**User Story:** As a user, I want clear visual feedback on which analyses are loading, completed, or currently displayed, so that I understand the system state at all times.

#### Acceptance Criteria

1. WHEN an analysis is loading THEN the corresponding button SHALL display a loading spinner and "Analyzing..." text
2. WHEN an analysis is completed THEN the button SHALL display a green checkmark indicator
3. WHEN an analysis is active (currently displayed) THEN the button SHALL have a blue highlighted border and background
4. WHEN a user hovers over an available button THEN the button SHALL scale slightly to indicate interactivity
5. WHEN a button is loading THEN it SHALL be disabled to prevent duplicate requests
6. WHEN all analyses are completed THEN all buttons SHALL show checkmarks and remain clickable for switching views

### Requirement 7: Analysis Type Display and Labeling

**User Story:** As a user, I want to clearly see which type of analysis I'm currently viewing, so that I understand the context of the feedback.

#### Acceptance Criteria

1. WHEN an analysis is displayed THEN the feedback card SHALL show the analysis type label (e.g., "Executive Summary", "Action Fixes")
2. WHEN switching between analyses THEN the label SHALL update to reflect the current analysis type
3. WHEN viewing the button grid THEN each button SHALL display its label and a brief description
4. WHEN an analysis type is selected THEN the system SHALL maintain visual consistency between the button label and feedback card header
5. WHEN displaying analysis types THEN the system SHALL use human-readable labels, not internal type identifiers

### Requirement 8: Responsive Grid Layout

**User Story:** As a user on any device, I want the analysis buttons to be easily accessible and well-organized, so that I can navigate the interface comfortably.

#### Acceptance Criteria

1. WHEN viewing on desktop THEN the system SHALL display buttons in a 3-column grid
2. WHEN viewing on tablet THEN the system SHALL display buttons in a 2-column grid
3. WHEN viewing on mobile THEN the system SHALL display buttons in a single column
4. WHEN the grid layout changes THEN all buttons SHALL remain fully visible and interactive
5. WHEN buttons are displayed THEN they SHALL have consistent spacing and alignment across all screen sizes

### Requirement 9: Smooth Animations and Transitions

**User Story:** As a user, I want smooth visual transitions when interacting with analysis buttons and viewing results, so that the interface feels polished and responsive.

#### Acceptance Criteria

1. WHEN an analysis result appears THEN it SHALL fade in with a smooth opacity and vertical slide animation
2. WHEN hovering over a button THEN it SHALL scale up smoothly over 300ms
3. WHEN clicking a button THEN it SHALL scale down briefly to provide tactile feedback
4. WHEN switching between analyses THEN the transition SHALL be smooth without jarring content shifts
5. WHEN animations play THEN they SHALL respect user's reduced motion preferences

### Requirement 10: Error Handling for Analysis Types

**User Story:** As a user, I want clear error messages if an analysis fails, so that I understand what went wrong and can take appropriate action.

#### Acceptance Criteria

1. IF an analysis request fails THEN the system SHALL display a user-friendly error message
2. WHEN an error occurs THEN the button SHALL return to its pre-loading state
3. IF the external AI API fails THEN the system SHALL log the error and inform the user
4. WHEN an invalid analysis type is requested THEN the system SHALL reject it with a validation error
5. IF database storage fails THEN the system SHALL notify the user and allow retry
