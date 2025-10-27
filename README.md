# Speaking Coach MVP

AI-powered speaking coach to improve your public speaking skills.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AI_MODEL_ENDPOINT=your-ai-model-endpoint
```

## Project Structure

```
/app                    # Next.js App Router pages
  /api                  # API routes
  /dashboard            # Dashboard page
  layout.tsx            # Root layout
  page.tsx              # Landing page
  globals.css           # Global styles
/components             # React components
/lib                    # Utility libraries (Supabase clients, types)
/utils                  # Helper functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- User authentication (email/password + Google OAuth)
- Video upload with drag-and-drop
- AI-powered speaking analysis
- Feedback display
- Upload history

## License

ISC
# Public-Speaking-AI
