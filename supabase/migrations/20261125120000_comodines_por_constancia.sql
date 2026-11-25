-- =====================================================================
-- Racha · Comodines por constancia
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Cada 4 semanas SEGUIDAS cumpliendo tu meta semanal ganás 1 comodín
-- (hasta 6, el mismo tope que el premio por invitar).
--
-- · Semana = lunes a domingo, hora de Argentina.
-- · Se cumple la semana si en ALGUNO de tus grupos entrenaste al
--   menos tantos días como tu meta en ese grupo.
-- · Los días recuperados con comodín NO cuentan (no se puede usar un
--   comodín para ganar otro).
-- · Solo cuentan semanas ya terminadas. El lunes, al abrir la app,
--   se revisa la semana anterior.
-- · La primera vez se miran hasta 3 semanas para atrás, para que tu
--   progreso arranque con lo que ya venías haciendo (sin regalar un
--   comodín de entrada).
-- =====================================================================

begin;

create table if not exists public.user_consistency (
  user_id uuid primary key
    references public.profiles (id)
    on delete cascade,

  -- Lunes de la última semana ya revisada.
  last_counted_week date not null,

  -- Semanas seguidas cumpliendo la meta.
  current_run integer not null default 0,

  -- Comodines ganados por constancia en total.
  total_rewards integer not null default 0,

  updated_at timestamptz not null default now()
);

alter table public.user_consistency
  enable row level security;

grant select on public.user_consistency to authenticated;

drop policy if exists "user_consistency_select_own"
  on public.user_consistency;

create policy "user_consistency_select_own"
  on public.user_consistency
  for select
  to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- ¿Cumplió la meta esa semana en algún grupo?
-- ---------------------------------------------------------------------

create or replace function public.consistency_week_met(
  p_user_id uuid,
  p_week_start date
)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (
    select 1
    from public.group_members gm
    where gm.user_id = p_user_id
      and (
        select count(distinct a.activity_date)
        from public.activities a
        where a.user_id = p_user_id
          and a.group_id = gm.group_id
          and a.activity_date between p_week_start and p_week_start + 6
          and not coalesce(a.recovered_with_wildcard, false)
      ) >= greatest(1, coalesce(gm.weekly_goal, 4))
  );
$function$;

revoke all on function public.consistency_week_met(uuid, date)
  from public, anon, authenticated;


-- ---------------------------------------------------------------------
-- La llama la app al abrir: revisa semanas nuevas y entrega comodines
-- ---------------------------------------------------------------------

drop function if exists public.claim_consistency_wildcards();

create or replace function public.claim_consistency_wildcards()
 returns table (
   granted integer,
   current_run integer,
   balance smallint,
   at_cap boolean
 )
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user uuid := auth.uid();
  v_today date := timezone('America/Argentina/Buenos_Aires', now())::date;
  v_last_complete date := date_trunc('week', v_today)::date - 7;
  v_week date;
  v_run integer;
  v_granted integer := 0;
  v_capped boolean := false;
  v_balance smallint;
  v_state public.user_consistency%rowtype;
  v_steps integer := 0;
begin
  if v_user is null then
    raise exception 'Tenés que iniciar sesión.';
  end if;

  -- Crea la billetera si falta y aplica la recarga mensual.
  perform public.refresh_user_wildcards(v_user);

  select * into v_state
  from public.user_consistency uc
  where uc.user_id = v_user
  for update;

  if not found then
    -- Primera vez: progreso con hasta 3 semanas previas, sin premio.
    v_run := 0;
    v_week := v_last_complete;

    while v_run < 3
      and public.consistency_week_met(v_user, v_week) loop
      v_run := v_run + 1;
      v_week := v_week - 7;
    end loop;

    insert into public.user_consistency (user_id, last_counted_week, current_run)
    values (v_user, v_last_complete, v_run)
    on conflict (user_id) do nothing;

  else
    v_run := v_state.current_run;
    v_week := v_state.last_counted_week + 7;

    select w.balance into v_balance
    from public.user_wildcards w
    where w.user_id = v_user
    for update;

    -- Como mucho un año de semanas por vez.
    while v_week <= v_last_complete and v_steps < 53 loop
      v_steps := v_steps + 1;

      if public.consistency_week_met(v_user, v_week) then
        v_run := v_run + 1;

        if v_run % 4 = 0 then
          if v_balance < 6 then
            v_balance := v_balance + 1;
            v_granted := v_granted + 1;
          else
            v_capped := true;
          end if;
        end if;
      else
        v_run := 0;
      end if;

      v_week := v_week + 7;
    end loop;

    if v_granted > 0 then
      update public.user_wildcards w
      set balance = v_balance,
          updated_at = now()
      where w.user_id = v_user;
    end if;

    update public.user_consistency uc
    set last_counted_week = greatest(uc.last_counted_week, v_last_complete),
        current_run = v_run,
        total_rewards = uc.total_rewards + v_granted,
        updated_at = now()
    where uc.user_id = v_user;
  end if;

  select w.balance into v_balance
  from public.user_wildcards w
  where w.user_id = v_user;

  return query
  select v_granted, v_run, v_balance, (v_capped or v_balance >= 6);
end;
$function$;

revoke all on function public.claim_consistency_wildcards()
  from public, anon;

grant execute on function public.claim_consistency_wildcards()
  to authenticated;

commit;
