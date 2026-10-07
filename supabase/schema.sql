-- Run this in the Supabase SQL editor before configuring the Vercel environment.
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.portfolio_content (
  id text primary key check (id = 'primary'),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
alter table public.portfolio_content enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated;

drop policy if exists "Public can read portfolio content" on public.portfolio_content;
create policy "Public can read portfolio content"
  on public.portfolio_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert portfolio content" on public.portfolio_content;
create policy "Admins can insert portfolio content"
  on public.portfolio_content for insert
  to authenticated
  with check (public.is_portfolio_admin());

drop policy if exists "Admins can update portfolio content" on public.portfolio_content;
create policy "Admins can update portfolio content"
  on public.portfolio_content for update
  to authenticated
  using (public.is_portfolio_admin())
  with check (public.is_portfolio_admin());

drop policy if exists "Admins can delete portfolio content" on public.portfolio_content;
create policy "Admins can delete portfolio content"
  on public.portfolio_content for delete
  to authenticated
  using (public.is_portfolio_admin());

drop policy if exists "Admins can view their admin record" on public.portfolio_admins;
create policy "Admins can view their admin record"
  on public.portfolio_admins for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.portfolio_content to anon, authenticated;
grant insert, update, delete on public.portfolio_content to authenticated;
grant select on public.portfolio_admins to authenticated;

-- After creating your account under Authentication > Users, allow it to administer content:
-- insert into public.portfolio_admins (user_id)
-- values ('YOUR-AUTH-USER-UUID');
