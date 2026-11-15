-- =====================================================================
-- Racha · Fotos en actividades + comentarios
-- =====================================================================
--
-- Correr UNA vez en Supabase → SQL Editor, ANTES de mezclar el PR.
-- Se puede volver a correr sin romper nada (usa IF NOT EXISTS /
-- DROP POLICY IF EXISTS).
--
-- Supone que activities.id, groups.id y profiles.id son uuid.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. FOTO OPCIONAL EN CADA ACTIVIDAD
-- ---------------------------------------------------------------------

alter table public.activities
  add column if not exists photo_url text;


-- ---------------------------------------------------------------------
-- 2. BUCKET PARA LAS FOTOS
-- ---------------------------------------------------------------------
--
-- Público, igual que "avatars": cualquiera con el link exacto puede
-- ver la foto. Los nombres de archivo son aleatorios (uuid), así que
-- no se pueden adivinar ni listar.
--
-- Ruta: {group_id}/{user_id}/{uuid}.jpg

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'activity-photos',
  'activity-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Subir: solo en tu carpeta y solo en grupos donde sos miembro.
drop policy if exists "activity_photos_insert_own" on storage.objects;

create policy "activity_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id::text = (storage.foldername(name))[1]
        and gm.user_id = auth.uid()
    )
  );

-- Borrar: solo tus propias fotos.
drop policy if exists "activity_photos_delete_own" on storage.objects;

create policy "activity_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- 3. COMENTARIOS
-- ---------------------------------------------------------------------

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),

  activity_id uuid not null
    references public.activities (id)
    on delete cascade,

  user_id uuid not null default auth.uid()
    references public.profiles (id)
    on delete cascade,

  body text not null
    check (char_length(btrim(body)) between 1 and 280),

  created_at timestamptz not null default now()
);

create index if not exists activity_comments_activity_id_idx
  on public.activity_comments (activity_id, created_at);

alter table public.activity_comments
  enable row level security;

-- Supabase suele dar estos permisos solo; los dejamos explícitos
-- por las dudas. RLS (abajo) es lo que limita qué filas.
grant select, insert, delete
  on public.activity_comments
  to authenticated;

-- Ver: los miembros del grupo de la actividad.
drop policy if exists "activity_comments_select_group" on public.activity_comments;

create policy "activity_comments_select_group"
  on public.activity_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.activities a
      join public.group_members gm
        on gm.group_id = a.group_id
      where a.id = activity_comments.activity_id
        and gm.user_id = auth.uid()
    )
  );

-- Comentar: como vos mismo y en actividades de tus grupos.
drop policy if exists "activity_comments_insert_group" on public.activity_comments;

create policy "activity_comments_insert_group"
  on public.activity_comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.activities a
      join public.group_members gm
        on gm.group_id = a.group_id
      where a.id = activity_comments.activity_id
        and gm.user_id = auth.uid()
    )
  );

-- Borrar: solo tus comentarios.
drop policy if exists "activity_comments_delete_own" on public.activity_comments;

create policy "activity_comments_delete_own"
  on public.activity_comments
  for delete
  to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 4. REALTIME PARA COMENTARIOS
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'activity_comments'
  ) then
    alter publication supabase_realtime
      add table public.activity_comments;
  end if;
end
$$;
