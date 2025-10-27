# Personalized Speaking Coach

AI-powered public speaking feedback platform built with Next.js, Supabase, and Tailwind CSS.

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

3. Copy the environment variables template:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials and AI model endpoint

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

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Storage, Database)
- **Deployment**: Vercel

## Project Structure

```
/app                    # Next.js App Router pages
  /page.tsx            # Landing/login page
  /dashboard           # Dashboard pages
  /api                 # API routes
/components            # React components
/lib                   # Utility libraries (Supabase clients)
/utils                 # Helper functions
```

## Environment Variables

See `.env.local.example` for required environment variables.

## License

ISC
