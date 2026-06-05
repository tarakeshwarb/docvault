# DocVault

DocVault is a Next.js App Router application for managing credential PDFs. It
stores metadata in a local Postgres database and keeps files in Cloudflare R2.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the Postgres table using `supabase/schema.sql` (optional for no-db mode).
3. Copy `.env.example` to `.env.local` and fill in your values.
4. Run the development server:

```bash
npm run dev
```

## Environment Variables

- DATABASE_URL (optional, only needed for Postgres)
- R2_ENDPOINT
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- R2_PUBLIC_BASE_URL

## Deployment

Set the same environment variables in Vercel before deploying.
