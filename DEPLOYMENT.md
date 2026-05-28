# DipzArc — Deployment Guide

Complete step-by-step setup from zero to live.

---

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (free tier works)
- Git installed

---

## Step 1 — Supabase Project Setup

### 1.1 Create the project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a name (e.g. `dipzarc`), set a strong DB password, pick the region closest to your users
3. Wait ~2 minutes for provisioning

### 1.2 Run the schema

1. In your Supabase dashboard → **SQL Editor** → New query
2. Paste the entire contents of `dipzarc_supabase_schema.sql`
3. Click **Run** — you should see "Success. No rows returned"
4. Run `dipzarc_schema_patch.sql` the same way (adds `increment_daily_count`)

### 1.3 Get your API keys

Go to **Project Settings → API**. You need:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret) |

### 1.4 Enable Email Auth

**Authentication → Providers → Email** — make sure it's enabled.
Disable "Confirm email" during development if you want instant signups.

### 1.5 Enable pg_cron (optional but recommended)

Go to **Database → Extensions** → search for `pg_cron` → Enable.

Then in SQL Editor run:
```sql
-- Weekly reset every Monday 00:00 UTC
select cron.schedule('dipzarc-weekly-reset', '0 0 * * 1', 'select public.weekly_reset()');

-- Abandon stale sessions every 5 minutes
select cron.schedule('dipzarc-stale-sessions', '0 */12 * * *', 'select public.abandon_stale_sessions()');
```

---

## Step 2 — Local Development

### 2.1 Extract and install

```bash
tar -xzf dipzarc-full-p1-p5.tar.gz
cd dipzarc
npm install
```

### 2.2 Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=your-email@example.com
```

### 2.3 Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2.4 Create your admin account

1. Go to `/auth/signup` — create your account
2. In Supabase SQL Editor, run:

```sql
-- Replace with your actual email
update public.profiles
set role = 'admin', status = 'approved'
where email = 'your-email@example.com';
```

3. Sign in at `/auth/login` — you'll land on `/dashboard` with full admin access

### 2.5 Verify setup

- `/dashboard` loads with your profile
- `/admin/users` shows the user list
- `/admin/tasks` shows the 6 seed tasks
- Start a session → timer ticks → complete → aura updates

---

## Step 3 — Deploy to Vercel

### 3.1 Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial DipzArc build"
git remote add origin https://github.com/YOUR_USERNAME/dipzarc.git
git push -u origin main
```

### 3.2 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Build command: `npm run build` (default)
5. Output directory: `.next` (default)

### 3.3 Add environment variables

In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL        → your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   → your anon key
SUPABASE_SERVICE_ROLE_KEY       → your service role key
NEXT_PUBLIC_APP_URL             → https://your-app.vercel.app
```

> Set `NEXT_PUBLIC_APP_URL` to your actual Vercel URL after first deploy.

### 3.4 Deploy

Click **Deploy**. Vercel builds and deploys in ~2 minutes.

### 3.5 Update Supabase Auth redirect URLs

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/**`

### 3.6 Set production APP_URL

Once deployed, update `NEXT_PUBLIC_APP_URL` in Vercel to your final domain,
then redeploy (Vercel → Deployments → Redeploy).

---

## Step 4 — Custom Domain (optional)

### On Vercel
1. Project → Settings → Domains → Add domain
2. Follow the DNS instructions for your registrar

### Update Supabase
Add the custom domain to **Authentication → URL Configuration → Redirect URLs**.

Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to your custom domain.

---

## Step 5 — Post-Deploy Checklist

Run through these after every deploy:

- [ ] Sign up with a new account → check it lands on `/auth/pending`
- [ ] Approve the account from `/admin/users`
- [ ] Sign in → dashboard loads with correct profile
- [ ] Start a session → timer ticks → aura updates live
- [ ] Complete a session → aura added to profile
- [ ] Check `/leaderboard` updates in real time
- [ ] Visit `/u/your-username` → public profile renders
- [ ] Download share card from profile
- [ ] `/api/share-card?u=your-username` returns an SVG

---

## Step 6 — Ongoing Admin Tasks

### Approving users
Go to `/admin/users` → filter Pending → click Approve per user.

### Weekly reset
Runs automatically via pg_cron every Monday 00:00 UTC.
To trigger manually: `/admin/users` → click **Weekly Reset** → confirm.

### Adding tasks
`/admin/tasks` → **New Task** → fill form → Save.

### Banning users
`/admin/users` → find user → Ban. They're immediately locked out.

---

## Troubleshooting

### "relation does not exist" error on startup
The schema hasn't been run. Go back to Step 1.2.

### Users stuck on `/auth/pending` forever
You haven't approved them. Go to `/admin/users` and approve.

### Timer doesn't save after page refresh
Check your Supabase anon key is correct. The `sessions` RLS policy requires auth.

### Share card shows blank / 404
Make sure `NEXT_PUBLIC_APP_URL` is set correctly in your env vars.
The edge route at `/api/share-card` needs the Supabase URL env var too.

### Leaderboard not updating in real time
Supabase Realtime must be enabled for the `profiles` table.
Go to **Database → Replication** and ensure `profiles` is in the publication.

### pg_cron not available
Your Supabase plan may not include pg_cron. As an alternative, set up a
Vercel cron job that calls a protected API route:

```ts
// src/app/api/cron/weekly-reset/route.ts
import { createAdminClient } from '@/lib/supabase/server'
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const supabase = createAdminClient()
  await supabase.rpc('weekly_reset')
  return new Response('OK')
}
```

Then in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/weekly-reset",
    "schedule": "0 0 * * 1"
  }]
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Full URL of your deployment |
| `ADMIN_EMAIL` | Optional | Used for reference only |
| `CRON_SECRET` | Optional | Secret for Vercel cron auth |

---

## Architecture Summary

```
Browser
  │
  ├─ Next.js App Router (Vercel Edge / Node)
  │   ├─ Middleware        — auth guard, role checks
  │   ├─ Server Components — SSR data fetch
  │   ├─ Client Components — interactive UI, timer, real-time
  │   └─ API Routes        — /api/share-card (Edge SVG)
  │
  └─ Supabase (PostgreSQL + Auth + Realtime)
      ├─ Auth              — email/password, sessions
      ├─ Database          — profiles, tasks, sessions, leaderboard
      ├─ Row Level Security— enforced per-table
      ├─ DB Functions      — complete_session, weekly_reset, award_aura
      └─ Realtime          — live leaderboard + profile sync
```

---

*Built with Next.js 14 · Supabase · Tailwind CSS · Zustand · Recharts*
*DipzArc — Train. Grind. Ascend.*
