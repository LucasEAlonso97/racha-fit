-- =====================================================================
-- Racha · Deportes propios
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Cada uno puede crear su deporte con nombre y emoji (por ejemplo
-- "Crossfit ⚡"). Se guarda como type = 'Otra' más dos columnas
-- opcionales, así no se toca la lista de deportes que ya existe:
--
--   · custom_name: nombre (1 a 30 caracteres)
--   · custom_emoji: emoji
--
-- Las actividades de antes quedan igual (null).
-- =====================================================================

begin;

alter table public.activities
  add column if not exists custom_name text,
  add column if not exists custom_emoji text;

alter table public.activities
  drop constraint if exists activities_custom_name_check;

alter table public.activities
  add constraint activities_custom_name_check
  check (
    custom_name is null
    or char_length(btrim(custom_name)) between 1 and 30
  );

alter table public.activities
  drop constraint if exists activities_custom_emoji_check;

alter table public.activities
  add constraint activities_custom_emoji_check
  check (
    custom_emoji is null
    or char_length(custom_emoji) between 1 and 16
  );

commit;
