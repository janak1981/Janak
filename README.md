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
2. Disable public sign-ups in **Authentication → Settings**. The portfolio uses
   a protected, one-time first-admin registration instead.
3. Copy the project URL and publishable/anon key into `.env.local`, then add
   Supabase's server-only secret key and a one-time setup code:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   SUPABASE_SECRET_KEY=your-server-only-supabase-secret-key
   PORTFOLIO_ADMIN_SETUP_CODE=your-long-random-one-time-code
   ```

   Generate a high-entropy setup code with `openssl rand -hex 32`. Add all four
   variables in the Vercel project's **Settings → Environment Variables**
   (Production and Preview), then redeploy. If your project still uses the
   legacy `service_role` key, name that environment variable
   `SUPABASE_SERVICE_ROLE_KEY` instead; the server supports either name.
4. Visit `/admin`, choose **Create first admin account**, and enter Janak's
   email, a strong password (at least 12 characters), and the setup code. The
   server creates and verifies the account, then atomically grants the first
   admin access. Registration closes as soon as the first admin is added.
5. Remove `SUPABASE_SECRET_KEY` and `PORTFOLIO_ADMIN_SETUP_CODE` from Vercel
   after registration and redeploy. The secret key is only needed to bootstrap
   the first account; normal sign-in and CMS publishing use Supabase Auth and
   row-level security.
6. Sign in at `/admin` to edit the profile, create pages, and publish changes.
   Saved changes are published immediately and appear on the public site.

Only the publishable/anon key is used in the browser. Never expose the
Supabase secret/service-role key as a `NEXT_PUBLIC_` variable. Public visitors
can read the portfolio, but writes are restricted by row-level security to
IDs in `portfolio_admins`.

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
The repository's `vercel.json` explicitly selects the Next.js framework and
its `.next` build output, overriding a stale dashboard setting that expects a
`public` directory. Configure Supabase in Vercel before expecting live admin
edits to persist.