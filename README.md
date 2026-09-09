# Taskora 🚀

> AI-Powered Task Management — Tell Taskora what you need to do. Taskora organizes it.

## Features

- 🤖 **AI Inbox** — Type or speak naturally, AI extracts structured tasks
- 🎤 **Voice Capture** — Browser-native speech recognition
- 📊 **Dashboard** — Real-time stats, today's tasks, AI daily planner
- 📁 **Projects** — Auto-calculated progress from tasks
- 🗓️ **Calendar** — Task deadlines in calendar view
- 📝 **Notes** — Idea capture with convert-to-task
- 🔗 **Sharing** — Public shareable task links with permissions
- ⏱️ **Focus Timer** — Pomodoro sessions logged to analytics
- 📈 **Analytics** — Weekly charts, completion rate, focus time
- ⚙️ **Settings** — Profile, notifications, appearance

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (PostgreSQL + Row Level Security)
- **Auth**: Supabase Auth
- **AI**: OpenRouter → Llama 3.1 8B (free)
- **Styling**: Tailwind CSS + custom CSS variables
- **Deployment**: Vercel

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/MAAHMH6/taskora.git
cd taskora
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env.local` and fill in your values:
```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — From Supabase Dashboard → Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — From same page
- `OPENROUTER_API_KEY` — From https://openrouter.ai/keys
- `NEXT_PUBLIC_APP_URL` — Your app URL (e.g. http://localhost:3000)

### 3. Run the database schema
Go to Supabase Dashboard → SQL Editor → paste and run `supabase/schema.sql`

### 4. Run the app
```bash
npm run dev
```

## Deployment to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add all env variables in Vercel dashboard
4. Deploy!

## License

MIT
