# Project Structure

## Directory Organization

```
/app                      # Next.js App Router
  /api                    # API routes (server-side endpoints)
    /analyze              # POST: AI video analysis endpoint
    /upload-url           # POST: Generate S3 upload URL
    /preview-url          # POST: Generate S3 preview URL
  /dashboard              # Dashboard page (authenticated)
  page.tsx                # Landing/login page
  layout.tsx              # Root layout with metadata
  globals.css             # Global styles and Tailwind imports

/components               # React components
  UploadBox.tsx           # Drag-and-drop video upload component
  VideoPreview.tsx        # Video player component
  FeedbackCard.tsx        # Feedback display component

/lib                      # Core utilities and clients
  supabaseClient.ts       # Client-side Supabase instance
  supabaseServer.ts       # Server-side Supabase instance
  s3Client.ts             # AWS S3 client and URL generators
  types.ts                # TypeScript type definitions

/utils                    # Helper functions
  validation.ts           # File validation utilities
```

## Code Organization Patterns

### API Routes (`/app/api`)
- Use Next.js Route Handlers (not Pages Router API routes)
- Export async functions: `POST`, `GET`, etc.
- Return `NextResponse.json()` for responses
- Validate auth using `supabaseServer.auth.getUser()`
- Handle errors with try-catch and appropriate status codes

### Components (`/components`)
- Use `'use client'` directive for client components
- Props interfaces defined inline or at top of file
- Event handlers prefixed with `handle` (e.g., `handleUpload`)
- State management with React hooks

### Library Files (`/lib`)
- Server-only code uses `supabaseServer` (service role key)
- Client-side code uses `supabase` from `supabaseClient`
- S3 operations use pre-signed URLs (no direct client access)
- Export reusable functions and initialized clients

### Path Aliases
- Use `@/` prefix for imports from root (e.g., `@/lib/supabaseClient`)
- Configured in `tsconfig.json` paths

## Naming Conventions

- **Files**: PascalCase for components (`UploadBox.tsx`), camelCase for utilities (`s3Client.ts`)
- **Components**: PascalCase function names matching filename
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **Types/Interfaces**: PascalCase

## Authentication Pattern

- Client-side: Use `supabase.auth` from `@/lib/supabaseClient`
- Server-side: Use `supabaseServer.auth.getUser(token)` with Bearer token from headers
- Protected routes check session/user before rendering
