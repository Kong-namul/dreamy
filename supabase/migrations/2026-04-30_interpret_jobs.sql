-- ------------------------------------------------------------
-- interpret_jobs
-- Long-running dream interpretation jobs executed by Supabase Edge Functions.
-- Vercel only creates a job and polls status, avoiding the 60s function limit.
-- ------------------------------------------------------------

create table if not exists public.interpret_jobs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  email           text not null,
  client_run_id   text not null,
  type            text not null check (type in ('basic', 'premium')),
  dream           text not null,
  moods           text[] not null default '{}',
  source_locale   text not null default 'ko' check (source_locale in ('ko', 'en')),
  status          text not null default 'pending' check (status in (
    'pending', 'running', 'completed', 'failed', 'refunded'
  )),
  cost            integer not null,
  credits_after   integer,
  dream_id        uuid references public.dreams(id) on delete set null,
  error           text,
  created_at      timestamptz not null default now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

create unique index if not exists interpret_jobs_client_run_id_uniq
  on public.interpret_jobs(client_run_id);

create index if not exists interpret_jobs_user_created_idx
  on public.interpret_jobs(user_id, created_at desc);

create index if not exists interpret_jobs_status_created_idx
  on public.interpret_jobs(status, created_at desc);

alter table public.interpret_jobs enable row level security;
