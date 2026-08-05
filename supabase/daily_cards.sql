-- ─────────────────────────────────────────────
-- 타로 '하루 한 장' 기능 DB 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- (이 저장소는 마이그레이션 폴더가 없어 스키마를 수동으로 적용합니다)
-- ─────────────────────────────────────────────

-- 2.1 daily_cards — 하루 한 장 기록 (Phase 1)
create table if not exists public.daily_cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,                 -- KST 기준 날짜
  card_id       smallint not null,             -- 0~21 (메이저 아르카나)
  is_reversed   boolean not null default false,
  prompt_index  smallint not null default 0,   -- 해당 카드의 질문 variant 인덱스
  drawn_at      timestamptz not null default now(),
  constraint daily_cards_unique_per_day unique (user_id, date)
);

create index if not exists daily_cards_user_date_idx
  on public.daily_cards (user_id, date desc);

alter table public.daily_cards enable row level security;

-- 재추첨 방지: SELECT / INSERT 만 허용. UPDATE / DELETE 정책은 만들지 않습니다.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'daily_cards'
      and policyname = 'own rows select'
  ) then
    create policy "own rows select" on public.daily_cards
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'daily_cards'
      and policyname = 'own rows insert'
  ) then
    create policy "own rows insert" on public.daily_cards
      for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- 2.2 monthly_spreads — 회고형 스프레드 (Phase 3, 미리 생성만)
create table if not exists public.monthly_spreads (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  year_month   text not null,          -- 'YYYY-MM'
  past_card    smallint not null,      -- 지난달의 나
  present_card smallint not null,      -- 지금의 나
  release_card smallint not null,      -- 다음달에 두고 갈 것
  note         text,                   -- 사용자 회고 텍스트
  created_at   timestamptz not null default now(),
  constraint monthly_spreads_unique unique (user_id, year_month)
);

alter table public.monthly_spreads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'monthly_spreads'
      and policyname = 'own rows all'
  ) then
    create policy "own rows all" on public.monthly_spreads
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
