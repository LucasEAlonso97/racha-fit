-- =====================================================================
-- Racha · ¿Cómo te sentiste?
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Dos columnas opcionales en activities:
--   · mood: emoji de cómo te sentiste
--       tired 😫 · ok 😐 · strong 💪 · fire 🔥
--   · note: nota corta (hasta 140 caracteres)
--
-- Las actividades viejas quedan sin nada (null) y se ven igual que antes.
-- =====================================================================

begin;

alter table public.activities
  add column if not exists mood text,
  add column if not exists note text;

alter table public.activities
  drop constraint if exists activities_mood_check;

alter table public.activities
  add constraint activities_mood_check
  check (mood is null or mood in ('tired', 'ok', 'strong', 'fire'));

alter table public.activities
  drop constraint if exists activities_note_check;

alter table public.activities
  add constraint activities_note_check
  check (note is null or char_length(note) <= 140);

commit;
