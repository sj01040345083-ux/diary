-- 가계부에 '할부(개월수)' 칸을 추가합니다.
-- (지출 기록에 할부 개월수를 저장하기 위한 설정 — 0은 일시불)
--
-- Supabase → 왼쪽 메뉴 SQL Editor → New query 에 아래를 붙여넣고 Run 하세요.
-- 딱 한 번만 실행하면 됩니다. (이미 있으면 그냥 넘어가요)

alter table public.transactions
  add column if not exists installment integer not null default 0;
