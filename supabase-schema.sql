create table if not exists public.app_states (
  owner_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (owner_id, app_id)
);

alter table public.app_states enable row level security;

create policy "usuarios leem o proprio estado"
on public.app_states
for select
using (auth.uid() = owner_id);

create policy "usuarios inserem o proprio estado"
on public.app_states
for insert
with check (auth.uid() = owner_id);

create policy "usuarios atualizam o proprio estado"
on public.app_states
for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);
