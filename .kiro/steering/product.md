# Product Overview

**Personalized Speaking Coach** is an AI-powered public speaking feedback platform that helps users improve their presentation skills.

## Core Features

- **Video Upload**: Users upload practice presentation videos (MP4 format, max 250MB)
- **AI Analysis**: Videos are analyzed using Google Gemini AI for comprehensive speaking feedback
- **Feedback Reports**: Detailed feedback covering pace, clarity, filler words, body language, eye contact, tone, and overall presentation skills
- **User Authentication**: Email/password and Google OAuth sign-in via Supabase
- **Video Storage**: Secure video storage using AWS S3 with pre-signed URLs

## User Flow

1. User signs up/logs in on landing page
2. Dashboard allows video upload via drag-and-drop or file picker
3. Video uploads to S3, then sent to AI for analysis
4. Feedback is generated and stored in database
5. User views feedback with video preview

## Target Audience

Individuals practicing public speaking, presentations, or communication skills who want personalized, constructive AI feedback.
