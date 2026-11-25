-- =====================================================================
-- Racha · Logros con regalos
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Los logros (pestaña Rachas → Logros) ahora dan regalos según la
-- dificultad, y se reclaman con un botón:
--
--   · fáciles  -> sin regalo
--   · medianos -> 1 comodín
--   · difíciles -> 1 comodín + corona en el grupo por 7 días
--
-- · Cada logro se reclama una sola vez por persona (aunque esté en
--   varios grupos).
-- · Al reclamar, la base vuelve a contar las actividades de esa persona
--   en el grupo para confirmar que el logro está cumplido.
-- · Si ya tenés 6 comodines (el máximo), no se puede reclamar hasta que
--   uses alguno: así el regalo no se pierde.
-- · Los logros que ya estaban cumplidos también se pueden reclamar.
--
-- La lista de logros es la misma que en src/utils/achievements.ts.
-- =====================================================================

begin;

create table if not exists public.achievement_claims (
  user_id uuid not null
    references public.profiles (id)
    on delete cascade,

  achievement_id text not null,

  group_id uuid
    references public.groups (id)
    on delete set null,

  tier text not null,

  claimed_at timestamptz not null default now(),

  primary key (user_id, achievement_id)
);

alter table public.achievement_claims
  enable row level security;

grant select on public.achievement_claims to authenticated;

drop policy if exists "achievement_claims_select_own"
  on public.achievement_claims;

create policy "achievement_claims_select_own"
  on public.achievement_claims
  for select
  to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- Catálogo: id, qué se cuenta, meta y dificultad
-- ---------------------------------------------------------------------

create or replace function public.achievement_catalog()
 returns table (
   id text,
   metric text,
   goal integer,
   tier text
 )
 language sql
 immutable
 set search_path to ''
as $function$
  values
    ('first-activity', 'activities', 1, 'easy'),
    ('three-days', 'days', 3, 'easy'),
    ('three-streak', 'streak', 3, 'easy'),
    ('ten-activities', 'activities', 10, 'easy'),
    ('five-hours', 'minutes', 300, 'easy'),
    ('seven-streak', 'streak', 7, 'medium'),
    ('twenty-five-activities', 'activities', 25, 'medium'),
    ('ten-active-days', 'days', 10, 'easy'),
    ('ten-hours', 'minutes', 600, 'medium'),
    ('fourteen-streak', 'streak', 14, 'medium'),
    ('fifty-activities', 'activities', 50, 'medium'),
    ('thirty-active-days', 'days', 30, 'medium'),
    ('seventy-five-activities', 'activities', 75, 'medium'),
    ('hundred-activities', 'activities', 100, 'medium'),
    ('two-hundred-activities', 'activities', 200, 'medium'),
    ('three-sixty-five-activities', 'activities', 365, 'hard'),
    ('fifty-active-days', 'days', 50, 'medium'),
    ('hundred-active-days', 'days', 100, 'hard'),
    ('one-eighty-active-days', 'days', 180, 'hard'),
    ('three-sixty-five-active-days', 'days', 365, 'hard'),
    ('twenty-hours', 'minutes', 1200, 'medium'),
    ('fifty-hours', 'minutes', 3000, 'medium'),
    ('hundred-hours', 'minutes', 6000, 'hard'),
    ('two-hundred-hours', 'minutes', 12000, 'hard'),
    ('twenty-one-streak', 'streak', 21, 'medium'),
    ('thirty-streak', 'streak', 30, 'hard'),
    ('sixty-streak', 'streak', 60, 'hard'),
    ('hundred-streak', 'streak', 100, 'hard'),
    ('ten-gym', 'gym', 10, 'medium'),
    ('twenty-five-gym', 'gym', 25, 'medium'),
    ('ten-walks', 'walks', 10, 'medium'),
    ('twenty-five-walks', 'walks', 25, 'medium'),
    ('ten-runs', 'runs', 10, 'medium'),
    ('twenty-five-runs', 'runs', 25, 'medium'),
    ('ten-rides', 'rides', 10, 'medium'),
    ('twenty-five-rides', 'rides', 25, 'medium')
$function$;


-- ---------------------------------------------------------------------
-- Cuánto lleva una persona en un grupo, según lo que se mida
-- ---------------------------------------------------------------------

create or replace function public.achievement_metric_value(
  p_user_id uuid,
  p_group_id uuid,
  p_metric text
)
 returns integer
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_value integer;
begin
  if p_metric = 'activities' then
    select count(*) into v_value
    from public.activities a
    where a.user_id = p_user_id and a.group_id = p_group_id;

  elsif p_metric = 'days' then
    select count(distinct a.activity_date) into v_value
    from public.activities a
    where a.user_id = p_user_id and a.group_id = p_group_id;

  elsif p_metric = 'minutes' then
    select coalesce(sum(a.duration), 0) into v_value
    from public.activities a
    where a.user_id = p_user_id and a.group_id = p_group_id;

  elsif p_metric = 'streak' then
    -- Días seguidos más largos (islas de fechas consecutivas).
    select coalesce(max(island.days), 0) into v_value
    from (
      select count(*) as days
      from (
        select
          d.activity_date,
          d.activity_date
            - (row_number() over (order by d.activity_date))::integer
            as island_key
        from (
          select distinct a.activity_date
          from public.activities a
          where a.user_id = p_user_id and a.group_id = p_group_id
        ) d
      ) numbered
      group by numbered.island_key
    ) island;

  elsif p_metric in ('gym', 'walks', 'runs', 'rides') then
    select count(*) into v_value
    from public.activities a
    where a.user_id = p_user_id
      and a.group_id = p_group_id
      and a.type::text = case p_metric
        when 'gym' then 'Gym'
        when 'walks' then 'Caminata'
        when 'runs' then 'Correr'
        else 'Bicicleta'
      end;

  else
    v_value := 0;
  end if;

  return coalesce(v_value, 0);
end;
$function$;

revoke all on function public.achievement_metric_value(uuid, uuid, text)
  from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- Reclamar
-- ---------------------------------------------------------------------
--
-- Errores (la app los traduce):
--   NOT_MEMBER, UNKNOWN_ACHIEVEMENT, NO_GIFT, ALREADY_CLAIMED,
--   NOT_COMPLETED, WILDCARDS_FULL

create or replace function public.claim_achievement_reward(
  p_group_id uuid,
  p_achievement_id text
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_balance smallint;
  v_crown_until timestamptz;
begin
  if v_user is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = v_user
  ) then
    raise exception 'NOT_MEMBER';
  end if;

  select * into v_item
  from public.achievement_catalog() c
  where c.id = p_achievement_id;

  if not found then
    raise exception 'UNKNOWN_ACHIEVEMENT';
  end if;

  if v_item.tier not in ('medium', 'hard') then
    raise exception 'NO_GIFT';
  end if;

  if exists (
    select 1 from public.achievement_claims ac
    where ac.user_id = v_user and ac.achievement_id = p_achievement_id
  ) then
    raise exception 'ALREADY_CLAIMED';
  end if;

  if public.achievement_metric_value(v_user, p_group_id, v_item.metric)
     < v_item.goal then
    raise exception 'NOT_COMPLETED';
  end if;

  -- Comodín: billetera al día y con lugar.
  perform public.refresh_user_wildcards(v_user);

  select w.balance into v_balance
  from public.user_wildcards w
  where w.user_id = v_user
  for update;

  if coalesce(v_balance, 0) >= 6 then
    raise exception 'WILDCARDS_FULL';
  end if;

  update public.user_wildcards w
  set balance = w.balance + 1,
      updated_at = now()
  where w.user_id = v_user;

  -- Corona por 7 días (si ya tenía una, se estira).
  if v_item.tier = 'hard' then
    select greatest(now(), coalesce(max(p.expires_at), now()))
             + interval '7 days'
      into v_crown_until
    from public.group_member_perks p
    where p.group_id = p_group_id
      and p.user_id = v_user
      and p.kind = 'crown'
      and p.expires_at > now();

    insert into public.group_member_perks (
      group_id, user_id, kind, value, granted_by, expires_at
    )
    values (
      p_group_id, v_user, 'crown', null, v_user, v_crown_until
    );
  end if;

  insert into public.achievement_claims (
    user_id, achievement_id, group_id, tier
  )
  values (
    v_user, p_achievement_id, p_group_id, v_item.tier
  );

  return jsonb_build_object(
    'wildcard', true,
    'balance', v_balance + 1,
    'crown_until', v_crown_until
  );
end;
$function$;

revoke all on function public.claim_achievement_reward(uuid, text)
  from public, anon;

grant execute on function public.claim_achievement_reward(uuid, text)
  to authenticated;

commit;
