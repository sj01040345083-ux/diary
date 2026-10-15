-- 같은 날짜에 일기를 여러 개 저장할 수 있게 만듭니다.
-- (지금은 '한 날짜에 1개'로 제한돼 있어서, 그 제한만 풀어줍니다)
--
-- Supabase → 왼쪽 메뉴 SQL Editor → New query 에 아래를 통째로 붙여넣고 Run 하세요.
-- 딱 한 번만 실행하면 됩니다. (이미 풀려 있으면 아무 일도 안 일어나요)

-- 1) entry_date 가 들어간 '유일 제약(UNIQUE constraint)'을 제거
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.diaries'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%entry_date%'
  loop
    execute format('alter table public.diaries drop constraint %I', c.conname);
  end loop;
end $$;

-- 2) entry_date 가 들어간 '유일 인덱스(UNIQUE index)'가 있으면 그것도 제거
do $$
declare i record;
begin
  for i in
    select indexrelid::regclass as idxname
    from pg_index
    where indrelid = 'public.diaries'::regclass
      and indisunique
      and not indisprimary
      and pg_get_indexdef(indexrelid) ilike '%entry_date%'
  loop
    execute format('drop index if exists %s', i.idxname);
  end loop;
end $$;
