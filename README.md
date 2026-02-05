# Design Daily

Internal web application for design team daily reporting and performance tracking.

## Features

- **Designer Submission Portal** (`/submit`) - Upload daily design assets (images & videos) with drag & drop
- **Leaderboard** (`/leaderboard`) - View designer rankings by performance scores
- **Judging Panel** (`/judge`) - Admin-only anonymous rating of submissions (1-3 stars)
- **Admin Dashboard** (`/admin`) - Overview of all submissions, ratings, and designer performance

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router) with TypeScript
- [Supabase](https://supabase.com/) for Auth, Postgres database, and Storage
- [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
- [Recharts](https://recharts.org/) for data visualization

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd design-leaderboard
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

### 3. Set Up Database

1. Go to the **SQL Editor** in your Supabase dashboard
2. Run the SQL from `supabase/schema.sql` to create tables, functions, and policies

### 4. Set Up Storage

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `submissions`
3. Configure the bucket:
   - **Public bucket**: No (keep private)
   - **File size limit**: 50MB (to support videos)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime`
4. Run the SQL from `supabase/storage.sql` to set up storage policies

### 5. Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials (found in Project Settings > API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Create Admin User

1. Sign up for an account through the app
2. Go to Supabase **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin@email.com';
   ```

## Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth) with name and role (designer/admin) |
| `submissions` | Daily submissions (one per user per day) |
| `assets` | Media files (images & videos) for each submission |
| `ratings` | Admin ratings (1-3 stars) for productivity, quality, convertability |

## User Roles

- **Designer**: Can submit daily work, view leaderboard
- **Admin**: All designer permissions + judge submissions + view admin dashboard

## Project Structure

```
app/
├── (auth)/              # Login, signup pages
├── (protected)/         # Authenticated routes
│   ├── submit/          # Designer submission portal
│   ├── leaderboard/     # Rankings page
│   └── (admin)/         # Admin-only routes
│       ├── judge/       # Rating interface
│       └── admin/       # Dashboard
components/
├── ui/                  # shadcn/ui components
├── layout/              # Header, navigation
├── submit/              # Submission form components
├── judge/               # Rating components
├── leaderboard/         # Leaderboard components
└── admin/               # Dashboard components
lib/
├── supabase/            # Supabase client utilities
├── actions/             # Server actions
└── types/               # TypeScript types
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## License

Internal use only.
