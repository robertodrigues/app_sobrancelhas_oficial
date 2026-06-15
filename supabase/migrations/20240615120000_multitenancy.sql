alter table if exists public.clients
  add column if not exists user_id text;

alter table if exists public.analyses
  add column if not exists user_id text;

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists analyses_user_id_idx on public.analyses (user_id);

alter table public.clients enable row level security;
alter table public.analyses enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
on public.clients
for select
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
on public.clients
for insert
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
on public.clients
for update
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
on public.clients
for delete
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own"
on public.analyses
for select
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "analyses_insert_own" on public.analyses;
create policy "analyses_insert_own"
on public.analyses
for insert
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "analyses_update_own" on public.analyses;
create policy "analyses_update_own"
on public.analyses
for update
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "analyses_delete_own" on public.analyses;
create policy "analyses_delete_own"
on public.analyses
for delete
using ((auth.jwt() ->> 'sub') = user_id);

/*
  If you have additional per-user tables such as credits, purchase history, or image metadata,
  apply the same pattern:
  - add user_id text
  - create an index on user_id
  - enable RLS
  - add select/insert/update/delete policies using auth.jwt() ->> 'sub'
*/