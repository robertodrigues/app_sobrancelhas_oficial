alter table if exists public.clients
  add column if not exists user_id text;

alter table if exists public.analyses
  add column if not exists user_id text;

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists analyses_user_id_idx on public.analyses (user_id);

alter table public.clients disable row level security;
alter table public.analyses disable row level security;

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;

drop policy if exists "analyses_select_own" on public.analyses;
drop policy if exists "analyses_insert_own" on public.analyses;
drop policy if exists "analyses_update_own" on public.analyses;
drop policy if exists "analyses_delete_own" on public.analyses;

/*
  This app currently uses Clerk on the frontend and writes to Supabase with the public key.
  Until Supabase Auth or a backend token bridge is added, RLS would block these requests.
  Keeping RLS disabled here allows the app's existing user_id filters to work.
*/