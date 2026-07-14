# Team Guessing Game

A private React/Vite/Tailwind game for matching coworkers to shuffled facts and Spotify tracks.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- `@hello-pangea/dnd` for drag and drop
- Supabase Postgres for game data, submissions, scoring records, and leaderboard
- Supabase Edge Function for private answer-key scoring
- Supabase Auth for simple email/password player login
- Netlify `_headers` Basic Auth perimeter

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs with local mock data until Supabase env vars are configured.

## Supabase Setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **Project Settings > API** or the **Connect** dialog.
3. Copy the Project URL and Publishable key. Legacy anon key also works for v1.
4. Put them in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

Only use publishable or anon keys in Vite. Secret or service-role keys belong only in Supabase Edge Functions or other backend-only environments.

## Database

The database schema, RLS policies, mock game data, private answer key, and seed leaderboard entries live in:

```text
supabase/migrations/20260709191245_team_guessing_game_schema.sql
```

To apply it with the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste the migration SQL into **SQL Editor > New query** in a new Supabase project.

Logged-in browser reads are limited to:

- `participants`
- `fact_options`
- `song_options`
- `leaderboard_entries`

Anonymous users cannot read the game tables. The app shows only the login page until Supabase Auth returns a valid session.

Private tables are RLS-enabled and not granted to browser roles:

- `answer_key`
- `submissions`
- `submission_guesses`

Submissions also store the logged-in Supabase Auth user id. The public app never sends the leaderboard name directly; it is derived server-side from the email username. For example, `nick@integrativeprivacy.com` appears as `Nick`.

## Auth

In Supabase, open **Authentication > Providers > Email** and keep Email enabled. For the easiest internal test flow, turn off email confirmations; otherwise, players must confirm their email before they can log in.

Players can only log in with existing Supabase Auth users. The app does not expose account creation.

## Edge Function

Submission scoring is handled by:

```text
supabase/functions/submit-guesses/index.ts
```

Deploy it after linking the project:

```bash
supabase functions deploy submit-guesses
```

`verify_jwt = true` requires players to be logged in before scoring. The function reads the logged-in user from the Supabase JWT, derives the display name from the email prefix, and keeps the secret/service key out of browser code.

## Verification

```bash
npm run build
```

Manual checks after Supabase is configured:

- App loads 9 names, 9 facts, and 9 songs from Supabase.
- Submit an all-correct board and confirm the response score is `18 / 18`.
- Submit a mixed board and confirm the score matches expected correct matches.
- Refresh and confirm the leaderboard reads from `leaderboard_entries`.
- Confirm the public key cannot read `answer_key`, `submissions`, or `submission_guesses`.
- Confirm the submit button stays disabled until every fact/song slot is complete and a player is logged in.

## Netlify Basic Auth

`public/_headers` is copied into the Vite build output. Change the placeholder credentials before deploying:

```text
/*
  Basic-Auth: yourteam:yourpassword
```
