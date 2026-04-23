-- ============================================================
-- Dreamy DB schema v1
-- Supabase (Postgres 15+) 에서 SQL Editor 에 전체 붙여넣고 Run.
-- 멱등성 보장 (여러 번 실행해도 안전: IF NOT EXISTS / ALTER ... ADD IF NOT EXISTS 등).
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
-- 탈퇴 후 동일 이메일로 재가입 가능하게 설계:
--   · 활성 유저는 deleted_at IS NULL. 이 조건에서 email 은 unique.
--   · 탈퇴 시 deleted_at = now() 만 마킹 (행은 보존).
--   · 같은 이메일로 재로그인 → 새 row 생성, 기존 기록과 분리.
-- ------------------------------------------------------------
create table if not exists public.users (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null,
  google_sub   text,
  nickname     text not null default '꿈꾸는이',
  avatar_url   text,
  credits      integer not null default 50,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create unique index if not exists users_active_email_uniq
  on public.users(email)
  where deleted_at is null;

create index if not exists users_email_idx on public.users(email);
create index if not exists users_google_sub_idx on public.users(google_sub) where google_sub is not null;


-- ------------------------------------------------------------
-- dreams
-- ------------------------------------------------------------
create table if not exists public.dreams (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  dream                   text not null,
  interpretation          text,
  moods                   text[] not null default '{}',
  auspice                 text check (auspice in ('auspicious','ominous','neutral')),
  type                    text not null check (type in ('basic','premium')),
  weather                 text,
  pages                   jsonb,
  interpretation_blocks   jsonb,
  lucky                   jsonb,
  shared                  boolean not null default false,
  created_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create index if not exists dreams_user_idx        on public.dreams(user_id, created_at desc);
create index if not exists dreams_shared_feed_idx on public.dreams(shared, created_at desc)
  where shared = true and deleted_at is null;


-- ------------------------------------------------------------
-- credit_transactions
-- ------------------------------------------------------------
create table if not exists public.credit_transactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         text not null check (type in ('purchase','spend','bonus','refund')),
  amount       integer not null,
  label        text not null,
  price_won    integer,
  created_at   timestamptz not null default now()
);

create index if not exists credit_tx_user_idx on public.credit_transactions(user_id, created_at desc);


-- ------------------------------------------------------------
-- dream_comments
-- author_name / author_initial 은 댓글 작성 시점의 스냅샷.
-- 작성자가 나중에 닉네임을 바꿔도 이미 달린 댓글 표기는 변하지 않음.
-- (이전 구현과 다른 정책 — 추후 UX 검토)
-- ------------------------------------------------------------
create table if not exists public.dream_comments (
  id              uuid primary key default uuid_generate_v4(),
  dream_id        uuid not null references public.dreams(id) on delete cascade,
  author_user_id  uuid not null references public.users(id) on delete cascade,
  author_name     text not null,
  author_initial  text not null,
  text            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists dream_comments_dream_idx on public.dream_comments(dream_id, created_at);


-- ------------------------------------------------------------
-- RLS: 모든 테이블에 활성화.
-- 정책 없음 = 클라이언트(publishable key)는 아무것도 못 읽고 못 씀.
-- 서버(secret key)가 service_role 로 bypass 하여 모든 접근을 검증 후 수행.
-- ------------------------------------------------------------
alter table public.users                enable row level security;
alter table public.dreams               enable row level security;
alter table public.credit_transactions  enable row level security;
alter table public.dream_comments       enable row level security;
