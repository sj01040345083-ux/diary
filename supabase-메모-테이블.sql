-- 월별 메모 기록장을 위한 'memos' 표를 만듭니다.
-- Supabase → 왼쪽 메뉴 SQL Editor → New query 에 아래를 그대로 붙여넣고 Run 하세요.
-- (딱 한 번만 실행하면 됩니다. 이미 있으면 그냥 넘어갑니다.)

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  content text not null default '',
  memo_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 날짜순 조회를 빠르게
create index if not exists memos_user_date_idx
  on public.memos (user_id, memo_date desc);

-- 내 메모만 보이고, 내 메모만 저장/수정/삭제되도록 보안(RLS) 설정
alter table public.memos enable row level security;

drop policy if exists "memos_select_own" on public.memos;
create policy "memos_select_own" on public.memos
  for select using (auth.uid() = user_id);

drop policy if exists "memos_insert_own" on public.memos;
create policy "memos_insert_own" on public.memos
  for insert with check (auth.uid() = user_id);

drop policy if exists "memos_update_own" on public.memos;
create policy "memos_update_own" on public.memos
  for update using (auth.uid() = user_id);

drop policy if exists "memos_delete_own" on public.memos;
create policy "memos_delete_own" on public.memos
  for delete using (auth.uid() = user_id);
