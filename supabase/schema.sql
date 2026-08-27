-- 《星途未定》靜態內容資料：通告／試鏡目錄。
-- 前端只需要讀取啟用中的內容；新增、修改與下架都保留給資料庫管理端。
create table if not exists public.job_catalog (
  id text primary key check (id ~ '^J[0-9]{3}$'),
  category text not null check (category in ('歌曲','電影','電視劇','綜藝','廣告')),
  stars smallint not null check (stars between 1 and 5),
  client text not null,
  title text not null,
  tagline text not null,
  synopsis text not null,
  pay bigint not null check (pay >= 0),
  sessions smallint not null check (sessions between 1 and 31),
  work_days smallint[] not null check (
    cardinality(work_days) between 1 and 7
    and work_days <@ array[0,1,2,3,4,5,6]::smallint[]
  ),
  deadline_weeks smallint not null check (deadline_weeks between 1 and 52),
  min_training_sessions smallint not null check (min_training_sessions between 1 and 260),
  requirements jsonb not null check (jsonb_typeof(requirements) = 'array'),
  soft_traits text[] not null default '{}',
  reputation_signals text[] not null default '{}',
  rewards jsonb not null check (jsonb_typeof(rewards) = 'object'),
  audition jsonb not null check (jsonb_typeof(audition) = 'object'),
  sort_order smallint not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_catalog_active_tier_idx
  on public.job_catalog (stars, category, sort_order)
  where is_active;

alter table public.job_catalog enable row level security;

revoke all on table public.job_catalog from anon, authenticated;
grant select on table public.job_catalog to anon, authenticated;

drop policy if exists "read active job catalog" on public.job_catalog;
create policy "read active job catalog"
  on public.job_catalog
  for select
  to anon, authenticated
  using (is_active = true);
