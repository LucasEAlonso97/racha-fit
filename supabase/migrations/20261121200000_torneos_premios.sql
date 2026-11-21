-- =====================================================================
-- Racha · Torneos: arranque automático, premios reales y vitrina
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
-- Todo corre en una transacción: si algo falla, no se aplica nada.
--
-- 1. Si quien tiene que elegir no lo hace en 48 h, se elige una carta
--    al azar. Lo mismo si nadie toca "Preparar próximo torneo".
-- 2. Premios nuevos, con peso (probabilidad) y que se RECLAMAN:
--      🃏 comodín · 👑 corona 7 días · 🏷️ apodo a alguien 7 días
--      🎴 elegís el próximo torneo · 📣 megáfono 24 h
--    Los premios simbólicos de antes quedan desactivados (no se borran).
-- 3. Vitrina de trofeos: cada torneo ganado se acumula por persona.
--
-- Ganadores: en todos contra todos, quienes tienen el puntaje más alto
-- (si empatan, todos). En 2 vs 2, el equipo con más puntos (si
-- empatan los equipos, no hay ganadores: el premio queda vacante).
-- Con 0 puntos no se gana: si nadie sumó, no hay campeón.
-- =====================================================================

begin;


-- ---------------------------------------------------------------------
-- 0. CHEQUEO: tournament_prizes no tiene columnas obligatorias raras
-- ---------------------------------------------------------------------

do $$
declare
  v_columns text;
begin
  select string_agg(column_name, ', ')
    into v_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'tournament_prizes'
    and is_nullable = 'NO'
    and column_default is null
    and column_name not in (
      'id', 'code', 'title', 'emoji', 'description', 'category', 'active',
      'prize_type', 'weight'
    );

  if v_columns is not null then
    raise exception
      'tournament_prizes tiene columnas obligatorias que esta migración no conoce: %. Avisale a Claude.',
      v_columns;
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 1. COLUMNAS NUEVAS
-- ---------------------------------------------------------------------

alter table public.tournaments
  add column if not exists auto_selected boolean not null default false,
  add column if not exists selector_override boolean not null default false;

alter table public.tournament_group_state
  add column if not exists next_selector_override uuid
    references public.profiles (id) on delete set null;

alter table public.tournament_prizes
  add column if not exists prize_type text,
  add column if not exists weight integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tournament_prizes_prize_type_check'
  ) then
    alter table public.tournament_prizes
      add constraint tournament_prizes_prize_type_check
      check (
        prize_type is null
        or prize_type in (
          'wildcard', 'crown', 'nickname', 'next_selector', 'megaphone'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'tournament_prizes_weight_check'
  ) then
    alter table public.tournament_prizes
      add constraint tournament_prizes_weight_check
      check (weight >= 0);
  end if;
end
$$;


-- ---------------------------------------------------------------------
-- 2. CATÁLOGO DE PREMIOS
-- ---------------------------------------------------------------------
--
-- weight = probabilidad relativa. Con estos valores:
--   comodín 45% · corona 30% · apodo 15% · elegir próximo 7% · megáfono 3%
-- Se pueden cambiar después desde la tabla tournament_prizes.

update public.tournament_prizes
set active = false
where prize_type is null;

insert into public.tournament_prizes (
  code, title, emoji, description, category, active, prize_type, weight
)
select 'app_' || v.prize_type, v.title, v.emoji, v.description,
       -- Una categoría que ya exista, por si la columna tiene valores fijos.
       coalesce(
         (select tp.category from public.tournament_prizes tp
          order by tp.category limit 1),
         'app'
       ),
       true, v.prize_type, v.weight
from (
  values
    ('Un comodín', '🃏',
     'Cada ganador suma 1 comodín para salvar un día (hasta 6).',
     'wildcard', 45),
    ('La corona', '👑',
     'Corona en tu avatar durante 7 días. Que todos sepan quién manda.',
     'crown', 30),
    ('Apodo para alguien', '🏷️',
     'Le ponés un apodo a alguien del grupo durante 7 días.',
     'nickname', 15),
    ('Elegís el próximo torneo', '🎴',
     'Te salteás la fila: la próxima carta la elegís vos.',
     'next_selector', 7),
    ('El megáfono', '📣',
     'Dejás un mensaje fijo en el inicio de todo el grupo durante 24 horas.',
     'megaphone', 3)
) as v (title, emoji, description, prize_type, weight)
where not exists (
  select 1 from public.tournament_prizes tp
  where tp.prize_type = v.prize_type
     or tp.code = 'app_' || v.prize_type
);


-- ---------------------------------------------------------------------
-- 3. TABLAS DE PREMIOS RECLAMADOS, CORONA/APODO Y MEGÁFONO
-- ---------------------------------------------------------------------

create table if not exists public.tournament_prize_claims (
  tournament_id uuid not null
    references public.tournaments (id) on delete cascade,
  user_id uuid not null
    references public.profiles (id) on delete cascade,
  prize_type text not null,
  detail jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create table if not exists public.group_member_perks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null
    references public.groups (id) on delete cascade,
  user_id uuid not null
    references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('crown', 'nickname')),
  value text,
  granted_by uuid
    references public.profiles (id) on delete set null,
  tournament_id uuid
    references public.tournaments (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists group_member_perks_group_idx
  on public.group_member_perks (group_id, expires_at);

create table if not exists public.group_banners (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null
    references public.groups (id) on delete cascade,
  user_id uuid not null
    references public.profiles (id) on delete cascade,
  message text not null,
  tournament_id uuid
    references public.tournaments (id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists group_banners_group_idx
  on public.group_banners (group_id, expires_at);

alter table public.tournament_prize_claims enable row level security;
alter table public.group_member_perks enable row level security;
alter table public.group_banners enable row level security;

-- Solo lectura desde la app. Se escribe con las funciones de abajo.
grant select on public.tournament_prize_claims to authenticated;
grant select on public.group_member_perks to authenticated;
grant select on public.group_banners to authenticated;

drop policy if exists "prize_claims_select_members" on public.tournament_prize_claims;
create policy "prize_claims_select_members"
  on public.tournament_prize_claims for select to authenticated
  using (
    exists (
      select 1
      from public.tournaments t
      join public.group_members gm on gm.group_id = t.group_id
      where t.id = tournament_prize_claims.tournament_id
        and gm.user_id = auth.uid()
    )
  );

drop policy if exists "member_perks_select_members" on public.group_member_perks;
create policy "member_perks_select_members"
  on public.group_member_perks for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_member_perks.group_id
        and gm.user_id = auth.uid()
    )
  );

drop policy if exists "group_banners_select_members" on public.group_banners;
create policy "group_banners_select_members"
  on public.group_banners for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_banners.group_id
        and gm.user_id = auth.uid()
    )
  );

do $$
declare
  v_table text;
begin
  foreach v_table in array array['group_member_perks', 'group_banners'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end
$$;


-- ---------------------------------------------------------------------
-- 4. LISTAS ARMADAS (apodos y mensajes del megáfono)
-- ---------------------------------------------------------------------
--
-- La app muestra estas mismas listas (src/lib/tournamentPrizes.ts).
-- Si cambiás una, cambiá la otra.

create or replace function public.tournament_nickname_options()
 returns text[]
 language sql
 immutable
as $$
  select array[
    'El del sillón 🛋️',
    'Promesa del running 🏃',
    'Leyenda del gym 💪',
    'Modo tortuga 🐢',
    'Rey del descanso 😴',
    'Máquina imparable 🚂',
    'Experto en excusas 🙃',
    'Influencer fitness 📸',
    'Atleta de fin de semana 📅',
    'El que nunca falla 🎯'
  ]
$$;

create or replace function public.tournament_megaphone_options()
 returns text[]
 language sql
 immutable
as $$
  select array[
    'Esta semana no se corta 🔥',
    'Los estoy mirando 👀',
    '¿Y la actividad de hoy? 🤨',
    'El campeón les manda saludos 👑',
    'Acá nadie se queda atrás 💪',
    'Hoy se entrena, mañana se presume 😎'
  ]
$$;


-- ---------------------------------------------------------------------
-- 5. GANADORES DE UN TORNEO
-- ---------------------------------------------------------------------

create or replace function public.tournament_winner_ids(p_tournament_id uuid)
 returns setof uuid
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_mode text;
  v_status text;
  v_team_one integer;
  v_team_two integer;
begin
  select t.mode::text, t.status::text
    into v_mode, v_status
  from public.tournaments t
  where t.id = p_tournament_id;

  if v_status is distinct from 'finished' then
    return;
  end if;

  if v_mode = 'two_vs_two' then
    select
      coalesce(sum(score) filter (where team_number = 1), 0),
      coalesce(sum(score) filter (where team_number = 2), 0)
      into v_team_one, v_team_two
    from public.tournament_participants
    where tournament_id = p_tournament_id;

    if v_team_one = v_team_two then
      return;
    end if;

    return query
      select tp.user_id
      from public.tournament_participants tp
      where tp.tournament_id = p_tournament_id
        and tp.team_number = case when v_team_one > v_team_two then 1 else 2 end;
  else
    return query
      select tp.user_id
      from public.tournament_participants tp
      where tp.tournament_id = p_tournament_id
        and tp.score > 0
        and tp.score = (
          select max(score)
          from public.tournament_participants
          where tournament_id = p_tournament_id
        );
  end if;
end;
$function$;


-- ---------------------------------------------------------------------
-- 6. ROTACIÓN: "ELEGÍS EL PRÓXIMO" SE SALTEA LA FILA
-- ---------------------------------------------------------------------
--
-- Igual que antes, pero si alguien ganó "Elegís el próximo torneo"
-- (next_selector_override) y sigue en el grupo, le toca a esa persona.

create or replace function public.get_next_tournament_selector(p_group_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_last_position integer;
  v_next_user uuid;
  v_override uuid;
begin
  perform public.initialize_tournament_rotation(p_group_id);

  select s.last_selector_position, s.next_selector_override
    into v_last_position, v_override
  from public.tournament_group_state s
  where s.group_id = p_group_id;

  -- Premio "Elegís el próximo torneo".
  if v_override is not null and exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = v_override
  ) then
    return v_override;
  end if;

  -- Primero alguien después de la última posición utilizada.
  select tr.user_id
    into v_next_user
  from public.tournament_rotation tr
  join public.group_members gm
    on gm.group_id = tr.group_id and gm.user_id = tr.user_id
  where tr.group_id = p_group_id
    and tr.rotation_position > v_last_position
  order by tr.rotation_position
  limit 1;

  -- Si llegamos al final, volvemos al principio.
  if v_next_user is null then
    select tr.user_id
      into v_next_user
    from public.tournament_rotation tr
    join public.group_members gm
      on gm.group_id = tr.group_id and gm.user_id = tr.user_id
    where tr.group_id = p_group_id
    order by tr.rotation_position
    limit 1;
  end if;

  return v_next_user;
end;
$function$;


-- ---------------------------------------------------------------------
-- 7. PREPARAR PRÓXIMO TORNEO (marca si el selector viene del premio)
-- ---------------------------------------------------------------------
--
-- Igual que antes. Lo único nuevo: guarda selector_override cuando el
-- selector es quien ganó "Elegís el próximo torneo".

create or replace function public.prepare_next_tournament(p_group_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_selector uuid;
  v_position integer;
  v_tournament_id uuid;
  v_existing uuid;
  v_existing_selector uuid;
  v_state_position integer;
  v_member_count integer;
  v_override uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  perform public.initialize_tournament_rotation(p_group_id);

  select s.last_selector_position, s.next_selector_override
    into v_state_position, v_override
  from public.tournament_group_state s
  where s.group_id = p_group_id
  for update;

  -- 1. Torneo activo.
  select t.id into v_existing
  from public.tournaments t
  where t.group_id = p_group_id and t.status = 'active'
  order by t.created_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- 2. Torneo esperando carta.
  select t.id, t.selector_user_id
    into v_existing, v_existing_selector
  from public.tournaments t
  where t.group_id = p_group_id and t.status = 'waiting_selection'
  order by t.created_at desc
  limit 1
  for update;

  if v_existing is not null then
    if exists (
      select 1 from public.group_members gm
      where gm.group_id = p_group_id and gm.user_id = v_existing_selector
    ) then
      return v_existing;
    end if;

    -- El selector abandonó: siguiente válido de la rueda.
    v_selector := public.get_next_tournament_selector(p_group_id);

    if v_selector is null then
      return v_existing;
    end if;

    select tr.rotation_position into v_position
    from public.tournament_rotation tr
    where tr.group_id = p_group_id and tr.user_id = v_selector;

    update public.tournaments
    set selector_user_id = v_selector,
        selector_position = v_position,
        selector_override = (v_selector = v_override)
    where id = v_existing;

    return v_existing;
  end if;

  -- 3. Resultado pendiente.
  select t.id into v_existing
  from public.tournaments t
  where t.group_id = p_group_id
    and t.status = 'finished'
    and t.result_acknowledged_at is null
  order by t.finished_at desc nulls last, t.created_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- 4. Crear nuevo torneo (acá sí exigimos mínimo dos).
  select count(*) into v_member_count
  from public.group_members gm
  where gm.group_id = p_group_id;

  if v_member_count < 2 then
    raise exception 'At least two members are required for a tournament';
  end if;

  v_selector := public.get_next_tournament_selector(p_group_id);

  if v_selector is null then
    raise exception 'Group has no tournament selector';
  end if;

  select tr.rotation_position into v_position
  from public.tournament_rotation tr
  where tr.group_id = p_group_id and tr.user_id = v_selector;

  insert into public.tournaments (
    group_id, selector_user_id, selector_position, status, selector_override
  )
  values (
    p_group_id, v_selector, v_position, 'waiting_selection',
    coalesce(v_selector = v_override, false)
  )
  returning id into v_tournament_id;

  return v_tournament_id;
end;
$function$;


-- ---------------------------------------------------------------------
-- 8. REVELAR TORNEO (uso interno)
-- ---------------------------------------------------------------------
--
-- Lo que hacía choose_tournament_card después de validar, separado
-- para poder usarlo también en el arranque automático. Cambios:
--   - el premio se elige con peso (weight) en lugar de al azar parejo
--   - si el selector venía del premio "Elegís el próximo", NO avanza
--     la rueda (así no se saltea a nadie) y se limpia el premio.

create or replace function public.reveal_tournament(
  p_tournament_id uuid,
  p_card integer,
  p_auto boolean
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tournament public.tournaments%rowtype;
  v_challenge_id uuid;
  v_prize_id uuid;
  v_member_count integer;
  v_mode text;
  v_today date;
begin
  select * into v_tournament
  from public.tournaments t
  where t.id = p_tournament_id
  for update;

  if v_tournament.id is null then
    raise exception 'Tournament not found';
  end if;

  if v_tournament.status <> 'waiting_selection' then
    raise exception 'Tournament already revealed';
  end if;

  select count(*) into v_member_count
  from public.group_members gm
  where gm.group_id = v_tournament.group_id;

  if v_member_count < 2 then
    raise exception 'At least two members are required for a tournament';
  end if;

  -- Desafío al azar.
  select tc.id into v_challenge_id
  from public.tournament_challenges tc
  where tc.active = true
  order by random()
  limit 1;

  if v_challenge_id is null then
    raise exception 'No active tournament challenges available';
  end if;

  -- Premio al azar CON PESO (muestreo ponderado).
  select tp.id into v_prize_id
  from public.tournament_prizes tp
  where tp.active = true
    and tp.weight > 0
  order by -ln(1.0 - random()) / tp.weight
  limit 1;

  if v_prize_id is null then
    raise exception 'No active tournament prizes available';
  end if;

  -- Modalidad: con exactamente 4, 50% 2 vs 2.
  if v_member_count = 4 and random() < 0.5 then
    v_mode := 'two_vs_two';
  else
    v_mode := 'free_for_all';
  end if;

  v_today := (now() at time zone 'America/Argentina/Buenos_Aires')::date;

  update public.tournaments
  set selected_card = p_card,
      challenge_id = v_challenge_id,
      prize_id = v_prize_id,
      mode = v_mode,
      status = 'active',
      starts_on = v_today,
      ends_on = v_today + 6,
      revealed_at = now(),
      auto_selected = p_auto
  where id = v_tournament.id;

  -- Participantes congelados.
  if v_mode = 'two_vs_two' then
    insert into public.tournament_participants (tournament_id, user_id, team_number)
    select v_tournament.id, shuffled.user_id,
           case when shuffled.position <= 2 then 1 else 2 end
    from (
      select gm.user_id, row_number() over (order by random()) as position
      from public.group_members gm
      where gm.group_id = v_tournament.group_id
    ) shuffled
    on conflict (tournament_id, user_id) do nothing;
  else
    insert into public.tournament_participants (tournament_id, user_id, team_number)
    select v_tournament.id, gm.user_id, null
    from public.group_members gm
    where gm.group_id = v_tournament.group_id
    on conflict (tournament_id, user_id) do nothing;
  end if;

  -- Rueda.
  if v_tournament.selector_override then
    -- Turno de premio: la rueda queda igual, se usa el premio.
    update public.tournament_group_state
    set next_selector_override = null,
        updated_at = now()
    where group_id = v_tournament.group_id;
  else
    insert into public.tournament_group_state (
      group_id, last_selector_position, updated_at
    )
    values (v_tournament.group_id, v_tournament.selector_position, now())
    on conflict (group_id) do update
    set last_selector_position = excluded.last_selector_position,
        updated_at = excluded.updated_at;
  end if;

  return jsonb_build_object(
    'success', true,
    'tournament_id', v_tournament.id,
    'selected_card', p_card,
    'challenge_id', v_challenge_id,
    'prize_id', v_prize_id,
    'mode', v_mode,
    'starts_on', v_today,
    'ends_on', v_today + 6,
    'auto_selected', p_auto
  );
end;
$function$;


-- ---------------------------------------------------------------------
-- 9. ELEGIR CARTA (igual que antes, revela con la función de arriba)
-- ---------------------------------------------------------------------

create or replace function public.choose_tournament_card(
  p_tournament_id uuid,
  p_card integer
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tournament public.tournaments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_card < 1 or p_card > 3 then
    raise exception 'Invalid card';
  end if;

  select * into v_tournament
  from public.tournaments t
  where t.id = p_tournament_id
  for update;

  if v_tournament.id is null then
    raise exception 'Tournament not found';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = v_tournament.group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = v_tournament.group_id
      and gm.user_id = v_tournament.selector_user_id
  ) then
    raise exception 'Tournament selector is no longer a group member';
  end if;

  if auth.uid() <> v_tournament.selector_user_id then
    raise exception 'Not your turn';
  end if;

  if v_tournament.status <> 'waiting_selection' then
    raise exception 'Tournament already revealed';
  end if;

  return public.reveal_tournament(p_tournament_id, p_card, false);
end;
$function$;


-- ---------------------------------------------------------------------
-- 10. ARRANQUE AUTOMÁTICO A LAS 48 h
-- ---------------------------------------------------------------------
--
-- Se ejecuta cada vez que alguien del grupo abre Torneos (o la app),
-- dentro de get_current_tournament. No hace falta ningún cron.
--
--   a) Torneo esperando carta hace más de 48 h → carta al azar.
--   b) Resultado sin continuar hace más de 48 h → se continúa solo y
--      se elige carta al azar en el mismo momento.
--
-- Si algo falla (ej. queda una sola persona en el grupo), no rompe
-- la carga del torneo: simplemente no arranca.

create or replace function public.auto_advance_tournament(p_group_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tournament_id uuid;
  v_next_id uuid;
  v_status text;
begin
  begin
    -- a) Esperando carta.
    select t.id into v_tournament_id
    from public.tournaments t
    where t.group_id = p_group_id
      and t.status = 'waiting_selection'
      and t.created_at < now() - interval '48 hours'
    order by t.created_at desc
    limit 1;

    if v_tournament_id is not null then
      perform public.reveal_tournament(
        v_tournament_id,
        1 + floor(random() * 3)::integer,
        true
      );
      return;
    end if;

    -- b) Resultado sin continuar.
    select t.id into v_tournament_id
    from public.tournaments t
    where t.group_id = p_group_id
      and t.status = 'finished'
      and t.result_acknowledged_at is null
      and t.finished_at < now() - interval '48 hours'
    order by t.finished_at desc
    limit 1;

    if v_tournament_id is null then
      return;
    end if;

    update public.tournaments
    set result_acknowledged_at = coalesce(result_acknowledged_at, now())
    where id = v_tournament_id;

    v_next_id := public.prepare_next_tournament(p_group_id);

    select t.status::text into v_status
    from public.tournaments t
    where t.id = v_next_id;

    if v_status = 'waiting_selection' then
      perform public.reveal_tournament(
        v_next_id,
        1 + floor(random() * 3)::integer,
        true
      );
    end if;
  exception
    when others then
      raise warning 'auto_advance_tournament(%): %', p_group_id, sqlerrm;
  end;
end;
$function$;


-- ---------------------------------------------------------------------
-- 11. TORNEO ACTUAL (con arranque automático y datos nuevos)
-- ---------------------------------------------------------------------
--
-- Igual que antes, más:
--   - corre el arranque automático al principio
--   - 'auto_selected', 'selection_deadline' (hasta cuándo hay tiempo)
--   - 'winner_ids' y 'claims' (quiénes ya reclamaron) si terminó
--   - 'prize_type' dentro de 'prize'

create or replace function public.get_current_tournament(p_group_id uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_tournament public.tournaments%rowtype;
  v_challenge jsonb;
  v_prize jsonb;
  v_participants jsonb;
  v_next_selector uuid;
  v_deadline timestamptz;
  v_winner_ids jsonb := '[]'::jsonb;
  v_claims jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  -- Nuevo: si alguien no eligió en 48 h, arranca solo.
  perform public.auto_advance_tournament(p_group_id);

  select * into v_tournament
  from public.tournaments t
  where t.group_id = p_group_id
    and (
      t.status in ('waiting_selection', 'active')
      or (t.status = 'finished' and t.result_acknowledged_at is null)
    )
  order by
    case when t.status in ('waiting_selection', 'active') then 0 else 1 end,
    t.created_at desc
  limit 1;

  if v_tournament.id is null then
    return null;
  end if;

  if v_tournament.status = 'active' then
    perform public.sync_tournament_scores(v_tournament.id);
  end if;

  if v_tournament.challenge_id is not null then
    select jsonb_build_object(
      'id', tc.id,
      'name', tc.name,
      'emoji', tc.emoji,
      'description', tc.description,
      'scoring_type', tc.scoring_type
    )
      into v_challenge
    from public.tournament_challenges tc
    where tc.id = v_tournament.challenge_id;
  end if;

  if v_tournament.prize_id is not null then
    select jsonb_build_object(
      'id', tp.id,
      'title', tp.title,
      'emoji', tp.emoji,
      'description', tp.description,
      'category', tp.category,
      'prize_type', tp.prize_type
    )
      into v_prize
    from public.tournament_prizes tp
    where tp.id = v_tournament.prize_id;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'user_id', participants.user_id,
        'name', profiles.name,
        'team_number', participants.team_number,
        'score', participants.score
      )
      order by participants.score desc, profiles.name asc
    ),
    '[]'::jsonb
  )
    into v_participants
  from public.tournament_participants participants
  join public.profiles profiles on profiles.id = participants.user_id
  where participants.tournament_id = v_tournament.id;

  if v_tournament.status = 'finished' then
    v_next_selector := public.get_next_tournament_selector(p_group_id);
    v_deadline := v_tournament.finished_at + interval '48 hours';

    select coalesce(jsonb_agg(w), '[]'::jsonb)
      into v_winner_ids
    from public.tournament_winner_ids(v_tournament.id) w;

    select coalesce(jsonb_agg(c.user_id), '[]'::jsonb)
      into v_claims
    from public.tournament_prize_claims c
    where c.tournament_id = v_tournament.id;
  elsif v_tournament.status = 'waiting_selection' then
    v_deadline := v_tournament.created_at + interval '48 hours';
  end if;

  return jsonb_build_object(
    'id', v_tournament.id,
    'group_id', v_tournament.group_id,
    'selector_user_id', v_tournament.selector_user_id,
    'selector_position', v_tournament.selector_position,
    'selected_card', v_tournament.selected_card,
    'mode', v_tournament.mode,
    'status', v_tournament.status,
    'starts_on', v_tournament.starts_on,
    'ends_on', v_tournament.ends_on,
    'winner_user_id', v_tournament.winner_user_id,
    'finished_at', v_tournament.finished_at,
    'result_acknowledged_at', v_tournament.result_acknowledged_at,
    'next_selector_user_id', v_next_selector,
    'challenge', v_challenge,
    'prize', v_prize,
    'participants', v_participants,
    'auto_selected', v_tournament.auto_selected,
    'selector_override', v_tournament.selector_override,
    'selection_deadline', v_deadline,
    'winner_ids', v_winner_ids,
    'claims', v_claims
  );
end;
$function$;


-- ---------------------------------------------------------------------
-- 12. HISTORIAL (con ganadores y reclamos)
-- ---------------------------------------------------------------------

create or replace function public.get_tournament_history(
  p_group_id uuid,
  p_limit integer default 10
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_history jsonb;
  v_limit integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 10), 50));

  select coalesce(
    jsonb_agg(history.item order by history.finished_at desc),
    '[]'::jsonb
  )
    into v_history
  from (
    select
      t.finished_at,
      jsonb_build_object(
        'id', t.id,
        'group_id', t.group_id,
        'selector_user_id', t.selector_user_id,
        'selected_card', t.selected_card,
        'mode', t.mode,
        'starts_on', t.starts_on,
        'ends_on', t.ends_on,
        'finished_at', t.finished_at,
        'winner_user_id', t.winner_user_id,
        'auto_selected', t.auto_selected,
        'challenge', case when tc.id is null then null else jsonb_build_object(
          'id', tc.id,
          'name', tc.name,
          'emoji', tc.emoji,
          'description', tc.description,
          'scoring_type', tc.scoring_type
        ) end,
        'prize', case when prize.id is null then null else jsonb_build_object(
          'id', prize.id,
          'title', prize.title,
          'emoji', prize.emoji,
          'description', prize.description,
          'category', prize.category,
          'prize_type', prize.prize_type
        ) end,
        'participants', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'user_id', participant.user_id,
                'name', profile.name,
                'team_number', participant.team_number,
                'score', participant.score,
                'weekly_goal_at_start', participant.weekly_goal_at_start
              )
              order by participant.score desc, profile.name asc
            ),
            '[]'::jsonb
          )
          from public.tournament_participants participant
          join public.profiles profile on profile.id = participant.user_id
          where participant.tournament_id = t.id
        ),
        'winner_ids', (
          select coalesce(jsonb_agg(w), '[]'::jsonb)
          from public.tournament_winner_ids(t.id) w
        ),
        'claims', (
          select coalesce(jsonb_agg(c.user_id), '[]'::jsonb)
          from public.tournament_prize_claims c
          where c.tournament_id = t.id
        )
      ) as item
    from public.tournaments t
    left join public.tournament_challenges tc on tc.id = t.challenge_id
    left join public.tournament_prizes prize on prize.id = t.prize_id
    where t.group_id = p_group_id
      and t.status = 'finished'
      and t.result_acknowledged_at is not null
    order by t.finished_at desc nulls last, t.created_at desc
    limit v_limit
  ) history;

  return v_history;
end;
$function$;


-- ---------------------------------------------------------------------
-- 13. RECLAMAR PREMIO
-- ---------------------------------------------------------------------
--
-- p_target_user_id: a quién le ponés el apodo (solo 'nickname').
-- p_choice: el apodo o el mensaje del megáfono (de las listas).

create or replace function public.claim_tournament_prize(
  p_tournament_id uuid,
  p_target_user_id uuid default null,
  p_choice text default null
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_tournament public.tournaments%rowtype;
  v_prize_type text;
  v_detail jsonb := '{}'::jsonb;
  v_waiting_id uuid;
  v_position integer;
  v_override uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_tournament
  from public.tournaments t
  where t.id = p_tournament_id
  for update;

  if v_tournament.id is null then
    raise exception 'Tournament not found';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = v_tournament.group_id and gm.user_id = v_user_id
  ) then
    raise exception 'Not a group member';
  end if;

  if v_tournament.status <> 'finished' then
    raise exception 'TOURNAMENT_NOT_FINISHED';
  end if;

  if not exists (
    select 1 from public.tournament_winner_ids(p_tournament_id) w
    where w = v_user_id
  ) then
    raise exception 'NOT_A_WINNER';
  end if;

  if exists (
    select 1 from public.tournament_prize_claims c
    where c.tournament_id = p_tournament_id and c.user_id = v_user_id
  ) then
    raise exception 'ALREADY_CLAIMED';
  end if;

  select tp.prize_type into v_prize_type
  from public.tournament_prizes tp
  where tp.id = v_tournament.prize_id;

  if v_prize_type is null then
    raise exception 'NOT_CLAIMABLE';
  end if;

  -- "Elegís el próximo": si otro ganador ya lo usó, te llevás un comodín.
  if v_prize_type = 'next_selector' and exists (
    select 1 from public.tournament_prize_claims c
    where c.tournament_id = p_tournament_id
      and c.prize_type = 'next_selector'
  ) then
    v_prize_type := 'wildcard';
    v_detail := jsonb_build_object('fallback_from', 'next_selector');
  end if;

  if v_prize_type = 'wildcard' then
    perform public.refresh_user_wildcards(v_user_id);

    update public.user_wildcards
    set balance = greatest(balance, least(balance + 1, 6)),
        updated_at = now()
    where user_id = v_user_id;

  elsif v_prize_type = 'crown' then
    insert into public.group_member_perks (
      group_id, user_id, kind, value, granted_by, tournament_id, expires_at
    )
    values (
      v_tournament.group_id, v_user_id, 'crown', null, v_user_id,
      p_tournament_id, now() + interval '7 days'
    );

  elsif v_prize_type = 'nickname' then
    if p_target_user_id is null or p_target_user_id = v_user_id then
      raise exception 'INVALID_TARGET';
    end if;

    if not exists (
      select 1 from public.group_members gm
      where gm.group_id = v_tournament.group_id
        and gm.user_id = p_target_user_id
    ) then
      raise exception 'INVALID_TARGET';
    end if;

    if p_choice is null
      or not (p_choice = any (public.tournament_nickname_options())) then
      raise exception 'INVALID_CHOICE';
    end if;

    -- Un solo apodo activo por persona: el nuevo reemplaza al anterior.
    update public.group_member_perks
    set expires_at = now()
    where group_id = v_tournament.group_id
      and user_id = p_target_user_id
      and kind = 'nickname'
      and expires_at > now();

    insert into public.group_member_perks (
      group_id, user_id, kind, value, granted_by, tournament_id, expires_at
    )
    values (
      v_tournament.group_id, p_target_user_id, 'nickname', p_choice,
      v_user_id, p_tournament_id, now() + interval '7 days'
    );

    v_detail := jsonb_build_object('target_user_id', p_target_user_id, 'nickname', p_choice);

  elsif v_prize_type = 'megaphone' then
    if p_choice is null
      or not (p_choice = any (public.tournament_megaphone_options())) then
      raise exception 'INVALID_CHOICE';
    end if;

    -- Un solo megáfono activo por grupo.
    update public.group_banners
    set expires_at = now()
    where group_id = v_tournament.group_id
      and expires_at > now();

    insert into public.group_banners (
      group_id, user_id, message, tournament_id, expires_at
    )
    values (
      v_tournament.group_id, v_user_id, p_choice, p_tournament_id,
      now() + interval '24 hours'
    );

    v_detail := jsonb_build_object('message', p_choice);

  elsif v_prize_type = 'next_selector' then
    select tr.rotation_position into v_position
    from public.tournament_rotation tr
    where tr.group_id = v_tournament.group_id and tr.user_id = v_user_id;

    -- Si el próximo ya está esperando carta, pasa a ser tuyo.
    select t.id into v_waiting_id
    from public.tournaments t
    where t.group_id = v_tournament.group_id
      and t.status = 'waiting_selection'
    order by t.created_at desc
    limit 1
    for update;

    if v_waiting_id is not null then
      update public.tournaments
      set selector_user_id = v_user_id,
          selector_position = v_position,
          selector_override = true,
          -- Arranca de cero el plazo de 48 h.
          created_at = now()
      where id = v_waiting_id;
    else
      -- Si no, el próximo que se prepare es tuyo.
      update public.tournament_group_state
      set next_selector_override = v_user_id,
          updated_at = now()
      where group_id = v_tournament.group_id;
    end if;
  end if;

  insert into public.tournament_prize_claims (
    tournament_id, user_id, prize_type, detail
  )
  values (p_tournament_id, v_user_id, v_prize_type, v_detail);

  return jsonb_build_object('prize_type', v_prize_type) || v_detail;
end;
$function$;


-- ---------------------------------------------------------------------
-- 14. VITRINA DE TROFEOS
-- ---------------------------------------------------------------------
--
-- Por persona: cuántos torneos ganó en este grupo y cuáles.
-- Cuenta todos los torneos terminados, también los de antes.

create or replace function public.get_trophy_cabinet(p_group_id uuid)
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to ''
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  ) then
    raise exception 'Not a group member';
  end if;

  select coalesce(jsonb_agg(per_user order by (per_user->>'count')::integer desc), '[]'::jsonb)
    into v_result
  from (
    select jsonb_build_object(
      'user_id', wins.user_id,
      'count', count(*),
      'trophies', jsonb_agg(
        jsonb_build_object(
          'tournament_id', wins.tournament_id,
          'emoji', wins.emoji,
          'name', wins.name,
          'finished_at', wins.finished_at
        )
        order by wins.finished_at desc
      )
    ) as per_user
    from (
      select t.id as tournament_id, t.finished_at,
             coalesce(tc.emoji, '🏆') as emoji,
             coalesce(tc.name, 'Torneo') as name,
             w.user_id
      from public.tournaments t
      left join public.tournament_challenges tc on tc.id = t.challenge_id
      cross join lateral (
        select x as user_id from public.tournament_winner_ids(t.id) x
      ) w
      where t.group_id = p_group_id
        and t.status = 'finished'
    ) wins
    group by wins.user_id
  ) cabinet;

  return v_result;
end;
$function$;


-- ---------------------------------------------------------------------
-- 15. PERMISOS
-- ---------------------------------------------------------------------
--
-- Las funciones internas no se pueden llamar desde la app.

revoke all on function public.reveal_tournament(uuid, integer, boolean) from public;
revoke all on function public.auto_advance_tournament(uuid) from public;
revoke all on function public.tournament_winner_ids(uuid) from public;

do $$
declare
  v_role text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on function public.reveal_tournament(uuid, integer, boolean) from %I', v_role);
      execute format('revoke all on function public.auto_advance_tournament(uuid) from %I', v_role);
      execute format('revoke all on function public.tournament_winner_ids(uuid) from %I', v_role);
    end if;
  end loop;
end
$$;

grant execute on function public.claim_tournament_prize(uuid, uuid, text) to authenticated;
grant execute on function public.get_trophy_cabinet(uuid) to authenticated;

commit;
