# Tech Stack

## Framework & Language

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Node.js 18.x or higher

## Frontend

- **UI Library**: React 19.x
- **Styling**: Tailwind CSS 4.x
- **Client-Side Routing**: Next.js App Router

## Backend & Services

- **Authentication & Database**: Supabase
  - Auth with email/password and Google OAuth
  - PostgreSQL database for user data and feedback sessions
- **Video Storage**: AWS S3 with pre-signed URLs
- **AI Model**: Google Gemini (gemini-2.5-flash) via `@google/generative-ai`

## Key Dependencies

- `@supabase/supabase-js` - Supabase client
- `@aws-sdk/client-s3` - AWS S3 operations
- `@aws-sdk/s3-request-presigner` - Generate pre-signed URLs
- `@google/generative-ai` - Google Gemini AI integration

## Common Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run Next.js linter
```

## Environment Variables

Required variables (see `.env.local.example`):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- AWS S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`
- AI: `GEMINI_API_KEY`

## Build System

- **Bundler**: Next.js built-in (Turbopack in dev, Webpack in production)
- **Module Resolution**: Path aliases using `@/*` for root imports
- **TypeScript**: Strict mode with incremental compilation
