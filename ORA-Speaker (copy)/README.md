# Personalized Speaking Coach

AI-powered public speaking feedback platform with interactive coaching chatbot, built with Next.js, Supabase, and Google Gemini AI.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account (for auth and database)
- AWS account (for S3 video storage)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables template:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials, AWS S3 credentials, and AI model endpoint
   - See `SUPABASE_SETUP_GUIDE.md` for Supabase setup
   - See `AWS_S3_SETUP_GUIDE.md` for S3 setup
   - See `AI_MODEL_API.md` for AI model endpoint integration details

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Features

- **Video Upload & Analysis**: Upload practice presentation videos (MP4, max 250MB) for AI-powered feedback
- **Comprehensive Feedback**: Get detailed analysis on pace, clarity, filler words, body language, eye contact, and tone
- **Interactive Coaching Chatbot**: Ask questions and receive personalized speaking advice based on your specific feedback
- **Conversation History**: Chat conversations are saved per feedback session for future reference
- **Context-Aware Responses**: The chatbot understands your performance metrics and provides tailored guidance
- **Suggested Questions**: Get smart question suggestions based on your areas for improvement

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.x
- **UI Library**: React 19.x
- **Backend**:
  - Supabase (Auth, Database)
  - AWS S3 (Video Storage)
  - Google Gemini AI (gemini-2.5-flash for video analysis and chatbot)
- **Deployment**: Vercel

## Project Structure

```
/app                      # Next.js App Router
  /api                    # API routes (server-side endpoints)
    /analyze              # POST: AI video analysis endpoint
    /upload-url           # POST: Generate S3 upload URL
    /preview-url          # POST: Generate S3 preview URL
    /chat                 # POST: Chatbot message endpoint
    /chat/history         # GET: Fetch chat history
  /dashboard              # Dashboard page (authenticated)
  page.tsx                # Landing/login page
  layout.tsx              # Root layout with metadata
  globals.css             # Global styles and Tailwind imports

/components               # React components
  UploadBox.tsx           # Drag-and-drop video upload component
  VideoPreview.tsx        # Video player component
  FeedbackCard.tsx        # Feedback display component
  ChatbotInterface.tsx    # Interactive chatbot component
  ChatMessage.tsx         # Individual message bubble component
  SuggestedQuestions.tsx  # Suggested question chips component

/lib                      # Core utilities and clients
  supabaseClient.ts       # Client-side Supabase instance
  supabaseServer.ts       # Server-side Supabase instance
  s3Client.ts             # AWS S3 client and URL generators
  types.ts                # TypeScript type definitions

/utils                    # Helper functions
  validation.ts           # File validation utilities
```

## Environment Variables

See `.env.local.example` for required environment variables:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **AWS S3**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- **Google Gemini AI**: `GEMINI_API_KEY`

### Database Setup

The application uses Supabase PostgreSQL with the following tables:

- `feedback_sessions`: Stores video feedback and analysis results
- `chat_messages`: Stores chatbot conversation history per feedback session

See `SUPABASE_SETUP_GUIDE.md` for detailed setup instructions including:

- Database schema and migrations
- Row Level Security (RLS) policies
- Authentication configuration

### AWS S3 Setup

See `AWS_S3_SETUP_GUIDE.md` for S3 bucket configuration and IAM permissions.

## License

ISC
