-- =====================================================================
-- Racha · Desafíos con fecha
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Un desafío es de un grupo: "Desafío de enero: 20 días entre el
-- 1/1 y el 31/1". Participan todos los integrantes automáticamente.
-- El progreso se calcula en la app con las actividades que ya existen,
-- así que acá solo se guarda la definición.
-- =====================================================================

create table if not exists public.group_challenges (
  id uuid primary key default gen_random_uuid(),

  group_id uuid not null
    references public.groups (id)
    on delete cascade,

  title text not null
    check (char_length(btrim(title)) between 1 and 60),

  target_days integer not null
    check (target_days between 1 and 366),

  starts_on date not null,
  ends_on date not null,

  created_by uuid not null default auth.uid()
    references public.profiles (id)
    on delete cascade,

  created_at timestamptz not null default now(),

  -- Hasta ~3 meses y la meta tiene que entrar en el período.
  constraint group_challenges_valid_dates
    check (
      ends_on >= starts_on
      and ends_on - starts_on <= 92
      and target_days <= (ends_on - starts_on) + 1
    )
);

create index if not exists group_challenges_group_idx
  on public.group_challenges (group_id, ends_on desc);

alter table public.group_challenges
  enable row level security;

grant select, insert, delete
  on public.group_challenges
  to authenticated;

-- Ver: integrantes del grupo.
drop policy if exists "group_challenges_select_members" on public.group_challenges;

create policy "group_challenges_select_members"
  on public.group_challenges
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_challenges.group_id
        and gm.user_id = auth.uid()
    )
  );

-- Crear: cualquier integrante, a su nombre.
drop policy if exists "group_challenges_insert_members" on public.group_challenges;

create policy "group_challenges_insert_members"
  on public.group_challenges
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_challenges.group_id
        and gm.user_id = auth.uid()
    )
  );

-- Borrar: quien lo creó.
drop policy if exists "group_challenges_delete_creator" on public.group_challenges;

create policy "group_challenges_delete_creator"
  on public.group_challenges
  for delete
  to authenticated
  using (created_by = auth.uid());

-- Tiempo real.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_challenges'
  ) then
    alter publication supabase_realtime
      add table public.group_challenges;
  end if;
end
$$;
