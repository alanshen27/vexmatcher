# Vex Matcher

A minimalistic companion for VEX teams during a competition. Pick your team
once, and the dashboard tells you:

- Your **upcoming matches** (with field, time, and a countdown).
- Your **alliance partners** for those matches and their *other* upcoming
  matches — so you know where to find them.
- Your **opponents** for those matches and their *other* upcoming matches —
  so you can scout them.
- The **full event schedule**, with your matches highlighted.
- A per-match **done** checkbox and **notes** textarea (scouting,
  strategy, reminders), persisted to Postgres via Prisma.

Data comes from the public
[RobotEvents API v2](https://www.robotevents.com/api/v2). Your team selection
is stored in a cookie on your device; notes are keyed to `(teamId, matchId)`.

## Setup

1. Get a RobotEvents API token from
   <https://www.robotevents.com/api/v2>.
2. Create a Postgres database (Supabase works great — use the project's
   connection string).
3. Create a file at the project root called `.env` containing:

   ```bash
   ROBOTEVENTS_TOKEN=eyJ...your-jwt-here...
   DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
   # Optional, for prisma migrate dev (non-pooled):
   # DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/postgres"
   ```

4. Install, push the schema, and start the dev server:

   ```bash
   npm install
   npm run db:push   # creates the match_note table
   npm run dev
   ```

4. Visit <http://localhost:3000>. You'll be sent to the onboarding screen to
   choose your team. After that, the dashboard auto-resolves your nearest
   event and starts surfacing matches.

## Using it

- The team you pick is saved in a `vex_team` cookie. Use the **Switch team**
  button (top-right of the dashboard) to clear it and start over.
- The dashboard picks your *current* event automatically — anything ongoing
  takes priority, otherwise it picks the soonest upcoming event in the next
  60 days. If you have nothing in that window, it falls back to your next
  scheduled event.
- Match data revalidates every 30s on the server, so just refresh after
  field results post.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- React 19
- Tailwind CSS v4
- Single-color (monochrome) UI — adapts to light/dark via
  `prefers-color-scheme`.

## Project layout

```
app/
  page.tsx                 redirects to onboarding or dashboard
  onboarding/              team picker form (server actions + cookie)
  dashboard/
    page.tsx               main view
    MatchNotes.tsx         checkbox + notes client component
    notes-actions.ts       server actions (toggle done, save notes)
    notes-types.ts         shared types
  lib/
    robotevents.ts         typed fetch wrapper for the API
    schedule.ts            event picking, partner/opponent extraction
    cookies.ts             team cookie helpers
    prisma.ts              Prisma client singleton
    format.ts              time/round formatters
prisma/
  schema.prisma            MatchNote model
```

## Scripts

- `npm run dev` — start Next.js dev server
- `npm run build` — generate Prisma client + production build
- `npm run db:push` — sync the Prisma schema to your database
- `npm run db:studio` — open Prisma Studio to browse notes
