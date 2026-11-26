-- =====================================================================
-- Racha · Panel de admin y sugerencias
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- 1. app_admins: quién puede ver el panel. Esta migración NO agrega a
--    nadie: después de correrla, sumate vos con el paso del final.
--
-- 2. app_daily_usage: una fila por persona y por día en que abrió la
--    app (con la hora de la primera y la última vez). Así se sabe quién
--    la usa aunque no cargue actividades. Arranca a contar desde que se
--    publica esta versión.
--
-- 3. app_feedback: ideas y problemas que manda la gente desde el
--    perfil. Hasta 10 por persona por día.
--
-- 4. Funciones admin_*: los números del panel. Solo responden si quien
--    las llama está en app_admins; a cualquier otro le dan error.
--
-- Ninguna de estas tablas se puede leer directo desde la app: todo pasa
-- por funciones.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Admins
-- ---------------------------------------------------------------------

create table if not exists public.app_admins (
  user_id uuid primary key
    references auth.users (id)
    on delete cascade,

  created_at timestamptz not null default now()
);

alter table public.app_admins
  enable row level security;

create or replace function public.is_app_admin()
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (
    select 1
    from public.app_admins a
    where a.user_id = auth.uid()
  );
$function$;

revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Uso diario (quién abre la app)
-- ---------------------------------------------------------------------

create table if not exists public.app_daily_usage (
  user_id uuid not null
    references public.profiles (id)
    on delete cascade,

  day date not null,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  opens integer not null default 1,

  primary key (user_id, day)
);

alter table public.app_daily_usage
  enable row level security;

create index if not exists app_daily_usage_day_idx
  on public.app_daily_usage (day);

create or replace function public.touch_app_usage()
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return;
  end if;

  insert into public.app_daily_usage (user_id, day)
  values (
    v_user,
    timezone('America/Argentina/Buenos_Aires', now())::date
  )
  on conflict (user_id, day) do update
  set last_seen_at = now(),
      opens = public.app_daily_usage.opens + 1;
end;
$function$;

revoke all on function public.touch_app_usage() from public, anon;
grant execute on function public.touch_app_usage() to authenticated;


-- ---------------------------------------------------------------------
-- 3. Sugerencias
-- ---------------------------------------------------------------------

create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references public.profiles (id)
    on delete set null,

  kind text not null
    check (kind in ('idea', 'problem')),

  message text not null
    check (char_length(message) between 3 and 1000),

  app_version text,

  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.app_feedback
  enable row level security;

create or replace function public.submit_feedback(
  p_kind text,
  p_message text,
  p_app_version text default null
)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_message text := btrim(coalesce(p_message, ''));
begin
  if v_user is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  if p_kind not in ('idea', 'problem') then
    raise exception 'INVALID_KIND';
  end if;

  if char_length(v_message) < 3 then
    raise exception 'TOO_SHORT';
  end if;

  if (
    select count(*)
    from public.app_feedback f
    where f.user_id = v_user
      and f.created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'TOO_MANY';
  end if;

  insert into public.app_feedback (user_id, kind, message, app_version)
  values (
    v_user,
    p_kind,
    left(v_message, 1000),
    left(p_app_version, 20)
  );
end;
$function$;

revoke all on function public.submit_feedback(text, text, text)
  from public, anon;
grant execute on function public.submit_feedback(text, text, text)
  to authenticated;


-- ---------------------------------------------------------------------
-- 4. Panel (solo admins)
-- ---------------------------------------------------------------------

create or replace function public.require_app_admin()
 returns void
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
begin
  if not public.is_app_admin() then
    raise exception 'NOT_ADMIN';
  end if;
end;
$function$;

revoke all on function public.require_app_admin()
  from public, anon, authenticated;


-- Números grandes de arriba.
create or replace function public.admin_overview()
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_today date := timezone('America/Argentina/Buenos_Aires', now())::date;
begin
  perform public.require_app_admin();

  return jsonb_build_object(
    'users_total',
      (select count(*) from public.profiles),

    'signups_7d',
      (select count(*) from auth.users u
       where u.created_at >= now() - interval '7 days'),

    'signups_30d',
      (select count(*) from auth.users u
       where u.created_at >= now() - interval '30 days'),

    'opened_today',
      (select count(distinct d.user_id) from public.app_daily_usage d
       where d.day = v_today),

    'opened_7d',
      (select count(distinct d.user_id) from public.app_daily_usage d
       where d.day > v_today - 7),

    'opened_30d',
      (select count(distinct d.user_id) from public.app_daily_usage d
       where d.day > v_today - 30),

    'trained_today',
      (select count(distinct a.user_id) from public.activities a
       where a.activity_date = v_today),

    'trained_7d',
      (select count(distinct a.user_id) from public.activities a
       where a.activity_date > v_today - 7),

    'trained_30d',
      (select count(distinct a.user_id) from public.activities a
       where a.activity_date > v_today - 30),

    'activities_7d',
      (select count(*) from public.activities a
       where a.activity_date > v_today - 7),

    'groups_total',
      (select count(*) from public.groups),

    'groups_active_7d',
      (select count(distinct a.group_id) from public.activities a
       where a.activity_date > v_today - 7),

    'usage_since',
      (select min(d.day) from public.app_daily_usage d),

    'feedback_unread',
      (select count(*) from public.app_feedback f
       where f.read_at is null)
  );
end;
$function$;


-- Día por día: cuántos abrieron, cuántos entrenaron, actividades y
-- registros nuevos.
create or replace function public.admin_daily(p_days integer default 30)
 returns table (
   day date,
   opened integer,
   trained integer,
   activities integer,
   signups integer
 )
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_today date := timezone('America/Argentina/Buenos_Aires', now())::date;
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 120);
begin
  perform public.require_app_admin();

  return query
  select
    s.day::date,
    (select count(distinct d.user_id)::integer
       from public.app_daily_usage d where d.day = s.day),
    (select count(distinct a.user_id)::integer
       from public.activities a where a.activity_date = s.day),
    (select count(*)::integer
       from public.activities a where a.activity_date = s.day),
    (select count(*)::integer
       from auth.users u
       where timezone('America/Argentina/Buenos_Aires', u.created_at)::date
             = s.day)
  from generate_series(v_today - (v_days - 1), v_today, interval '1 day') s(day)
  order by 1;
end;
$function$;


-- Retención: de los que se registraron cada semana, cuántos volvieron
-- (abrieron la app o cargaron algo) 1, 2 y 4 semanas después.
create or replace function public.admin_retention()
 returns table (
   cohort_week date,
   users integer,
   week1 integer,
   week2 integer,
   week4 integer
 )
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
begin
  perform public.require_app_admin();

  return query
  with signups as (
    select
      u.id as user_id,
      timezone('America/Argentina/Buenos_Aires', u.created_at)::date
        as signup_day
    from auth.users u
    where u.created_at >= now() - interval '12 weeks'
  ),
  seen as (
    select d.user_id, d.day from public.app_daily_usage d
    union
    select a.user_id, a.activity_date from public.activities a
  ),
  flags as (
    select
      s.user_id,
      date_trunc('week', s.signup_day)::date as week_start,
      exists (
        select 1 from seen x
        where x.user_id = s.user_id
          and x.day >= s.signup_day + 7 and x.day < s.signup_day + 14
      ) as w1,
      exists (
        select 1 from seen x
        where x.user_id = s.user_id
          and x.day >= s.signup_day + 14 and x.day < s.signup_day + 21
      ) as w2,
      exists (
        select 1 from seen x
        where x.user_id = s.user_id
          and x.day >= s.signup_day + 28 and x.day < s.signup_day + 35
      ) as w4
    from signups s
  )
  select
    f.week_start,
    count(*)::integer,
    count(*) filter (where f.w1)::integer,
    count(*) filter (where f.w2)::integer,
    count(*) filter (where f.w4)::integer
  from flags f
  group by f.week_start
  order by f.week_start desc;
end;
$function$;


-- Lista de usuarios con su última vez.
create or replace function public.admin_users()
 returns table (
   user_id uuid,
   name text,
   avatar_url text,
   signed_up_at timestamptz,
   last_seen_at timestamptz,
   last_activity date,
   activities_30d integer,
   groups integer
 )
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_today date := timezone('America/Argentina/Buenos_Aires', now())::date;
begin
  perform public.require_app_admin();

  return query
  select
    p.id,
    p.name,
    p.avatar_url,
    u.created_at,
    (select max(d.last_seen_at)
       from public.app_daily_usage d where d.user_id = p.id),
    (select max(a.activity_date)
       from public.activities a where a.user_id = p.id),
    (select count(*)::integer
       from public.activities a
       where a.user_id = p.id and a.activity_date > v_today - 30),
    (select count(*)::integer
       from public.group_members gm where gm.user_id = p.id)
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by 5 desc nulls last, 6 desc nulls last, 4 desc nulls last;
end;
$function$;


-- Sugerencias (las sin leer primero).
create or replace function public.admin_feedback(p_limit integer default 50)
 returns table (
   id uuid,
   user_name text,
   kind text,
   message text,
   app_version text,
   created_at timestamptz,
   read_at timestamptz
 )
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
begin
  perform public.require_app_admin();

  return query
  select
    f.id,
    coalesce(p.name, 'Usuario borrado'),
    f.kind,
    f.message,
    f.app_version,
    f.created_at,
    f.read_at
  from public.app_feedback f
  left join public.profiles p on p.id = f.user_id
  order by (f.read_at is null) desc, f.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$function$;


create or replace function public.admin_mark_feedback_read(p_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  perform public.require_app_admin();

  update public.app_feedback
  set read_at = coalesce(read_at, now())
  where id = p_id;
end;
$function$;


revoke all on function public.admin_overview() from public, anon;
revoke all on function public.admin_daily(integer) from public, anon;
revoke all on function public.admin_retention() from public, anon;
revoke all on function public.admin_users() from public, anon;
revoke all on function public.admin_feedback(integer) from public, anon;
revoke all on function public.admin_mark_feedback_read(uuid) from public, anon;

grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_daily(integer) to authenticated;
grant execute on function public.admin_retention() to authenticated;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_feedback(integer) to authenticated;
grant execute on function public.admin_mark_feedback_read(uuid) to authenticated;

commit;


-- =====================================================================
-- DESPUÉS DE CORRER LO DE ARRIBA: sumate como admin
-- =====================================================================
--
-- Corré esto aparte, poniendo el mail con el que entrás a Racha:
--
--   insert into public.app_admins (user_id)
--   select id from auth.users where email = 'TU_MAIL_ACÁ'
--   on conflict do nothing;
--
-- Para verificar:
--
--   select u.email from public.app_admins a
--   join auth.users u on u.id = a.user_id;
-- =====================================================================
