# Janak — Academic portfolio

A responsive academic portfolio for Janak, built with Next.js and designed to
deploy to the existing Vercel project at [janak-nine.vercel.app](https://janak-nine.vercel.app).
The `/admin` dashboard uses Supabase Auth and row-level security to manage the
public profile, pages, and entries.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The public portfolio works with the included starter content before Supabase
is connected. To use the admin dashboard, configure Supabase as described
below.

## Connect Supabase

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql)
   in its SQL editor.
2. In **Authentication → Users**, create Janak's admin account with a secure
   password. Disable public sign-ups in **Authentication → Settings**.
3. Copy that user's UUID and add them to the admin allow-list by running:

   ```sql
   insert into public.portfolio_admins (user_id)
   values ('YOUR-AUTH-USER-UUID');
   ```

4. Copy the project URL and publishable/anon key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   ```

5. Set the same variables in the Vercel project's **Settings → Environment
   Variables** for Production and Preview, then redeploy.
6. Sign in at `/admin`. The first save publishes the starter portfolio to
   Supabase. From then on, edits appear on the public site.

Only use the publishable/anon key in the frontend. Never expose a Supabase
service-role key as a `NEXT_PUBLIC_` variable. Public visitors can read the
portfolio, but writes are restricted by row-level security to IDs in
`portfolio_admins`.

## Portfolio editor

- **Profile** edits the homepage introduction, location, email, availability,
  and social links.
- **Pages** creates, renames, and removes pages. Each page can use a cards,
  timeline, editorial, or links presentation.
- Each page supports any number of entries, with a title, context, description,
  and optional external URL.
- The public site is populated with clearly generic starter copy. Replace it
  with Janak's verified details and contact links in the admin dashboard.

## Production deployment

This repository is linked to the Vercel project whose production domain is
`janak-nine.vercel.app`. Vercel builds the Next.js app using `npm run build`.
Configure Supabase in Vercel before expecting live admin edits to persist.