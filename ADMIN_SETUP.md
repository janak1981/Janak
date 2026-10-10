# Admin Setup Guide

## Admin Access

Your admin dashboard is available at:
```
https://janakbahadur.com.np/admin/login
```

## Setting Up Admin Credentials

Add this environment variable to your Vercel project:

**`PORTFOLIO_ADMIN_PASSWORD`** - Set to a strong password (example: `your-secure-password-123`)

You can also set:
- **`ADMIN_TOKEN_SECRET`** - For token generation (defaults to a safe value)

## How It Works

### Admin Login
1. Go to `janakbahadur.com.np/admin/login`
2. Enter your admin password
3. You'll receive an access token (stored in browser)
4. Token expires after 24 hours

### Admin Dashboard
Once logged in, you can:
- **Edit Settings**: Update your name, role, location, email, bio, etc.
- **Manage Pages**: Add, edit, or delete portfolio pages (Research, Teaching, Writing, etc.)
- **Arrange Content**: Reorder pages, change layouts (timeline, cards, prose, links)

### Public vs Admin
- **Regular visitors**: Can only VIEW content, no edit capabilities
- **Admin users**: Can edit everything, changes appear immediately after saving
- **Security**: Admin routes are protected by token authentication

## Vercel Environment Variables

Set these in Vercel Project Settings → Environment Variables:

```
PORTFOLIO_ADMIN_PASSWORD=your-strong-password-here
ADMIN_TOKEN_SECRET=your-token-secret-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-key
```

## Database (Optional: Supabase)

If you want content to persist in Supabase:

1. Create a table in Supabase:
```sql
create table portfolio_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);
```

2. Insert starter data:
```sql
insert into portfolio_content (id, data)
values ('primary', '{your content json here}');
```

Without Supabase configured, content is stored in memory (resets on deploy).

## Logging Out

Click the **Logout** button in the top right of the dashboard.

## Need to Reset Password?

Change the `PORTFOLIO_ADMIN_PASSWORD` environment variable in Vercel and redeploy.
