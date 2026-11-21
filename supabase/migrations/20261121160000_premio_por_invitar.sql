-- =====================================================================
-- Racha · Premio por invitar
-- =====================================================================
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- 1. Tu link de invitación lleva tu id: ?join=CODIGO&ref=TU_ID
-- 2. Si alguien NUEVO se une con ese link, queda anotado quién lo
--    invitó (claim_referral). Tiene que ser una cuenta de menos de
--    7 días, sin actividades y que nadie haya invitado antes.
-- 3. Cuando esa persona registra su PRIMERA actividad, quien la
--    invitó gana 1 comodín (hasta 6) y recibe una notificación.
-- =====================================================================

-- Tope de comodines que se puede alcanzar con premios.
-- (La recarga mensual sigue llegando hasta 3, como siempre.)


-- ---------------------------------------------------------------------
-- 1. LA RECARGA MENSUAL YA NO RECORTA EL SALDO
-- ---------------------------------------------------------------------
--
-- Idéntica a la versión anterior salvo UNA línea:
--
--   antes:  v_balance := least(3, v_balance + meses * 2)
--   ahora:  v_balance := greatest(v_balance, least(3, v_balance + meses * 2))
--
-- Para saldos de 0 a 3 el resultado es el mismo de siempre. Solo
-- cambia si alguien tiene más de 3 (por premios): antes la recarga
-- lo bajaba a 3, ahora lo deja como está.

create or replace function public.refresh_user_wildcards(p_user_id uuid)
 returns smallint
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_current_month date;

  v_last_month date;

  v_balance smallint;

  v_months_passed integer;
begin

  v_current_month :=
    date_trunc(
      'month',
      timezone(
        'America/Argentina/Buenos_Aires',
        now()
      )
    )::date;


  -- Si todavía no tiene billetera,
  -- empieza con 2 comodines.

  insert into public.user_wildcards (
    user_id,
    balance,
    last_grant_month
  )
  values (
    p_user_id,
    2,
    v_current_month
  )
  on conflict (user_id)
  do nothing;


  -- Bloqueamos la billetera durante
  -- esta transacción para evitar
  -- consumos dobles simultáneos.

  select
    balance,
    last_grant_month
  into
    v_balance,
    v_last_month
  from public.user_wildcards
  where user_id = p_user_id
  for update;


  v_months_passed :=
    (
      extract(
        year
        from v_current_month
      )::integer
      -
      extract(
        year
        from v_last_month
      )::integer
    ) * 12
    +
    (
      extract(
        month
        from v_current_month
      )::integer
      -
      extract(
        month
        from v_last_month
      )::integer
    );


  if v_months_passed > 0 then

    -- Nunca baja el saldo (ver arriba).
    v_balance :=
      greatest(
        v_balance,
        least(
          3,
          v_balance +
          (
            v_months_passed * 2
          )
        )
      );


    update public.user_wildcards
    set
      balance = v_balance,
      last_grant_month =
        v_current_month,
      updated_at = now()
    where
      user_id = p_user_id;

  end if;


  return v_balance;
end;
$function$;


-- ---------------------------------------------------------------------
-- 2. QUIÉN INVITÓ A QUIÉN
-- ---------------------------------------------------------------------

create table if not exists public.referrals (
  -- Cada persona puede ser invitada (con premio) una sola vez.
  invitee_id uuid primary key
    references public.profiles (id)
    on delete cascade,

  inviter_id uuid not null
    references public.profiles (id)
    on delete cascade,

  group_id uuid not null
    references public.groups (id)
    on delete cascade,

  created_at timestamptz not null default now(),

  -- Cuándo se entregó el comodín (null = todavía no).
  rewarded_at timestamptz,

  constraint referrals_not_self
    check (invitee_id <> inviter_id)
);

create index if not exists referrals_inviter_idx
  on public.referrals (inviter_id);

alter table public.referrals
  enable row level security;

grant select on public.referrals to authenticated;

-- Cada uno ve sus invitaciones (las que hizo y la que recibió).
-- Nadie escribe directo: solo las funciones de abajo.
drop policy if exists "referrals_select_own" on public.referrals;

create policy "referrals_select_own"
  on public.referrals
  for select
  to authenticated
  using (
    inviter_id = auth.uid()
    or invitee_id = auth.uid()
  );


-- ---------------------------------------------------------------------
-- 3. ANOTAR LA INVITACIÓN (la llama la app al unirse con el link)
-- ---------------------------------------------------------------------
--
-- Devuelve true si quedó anotada. Si no cumple las condiciones,
-- devuelve false sin error (no hay nada que mostrarle al usuario).

create or replace function public.claim_referral(
  p_inviter_id uuid,
  p_group_id uuid
)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_user_id uuid;
  v_inserted integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null
    or p_inviter_id is null
    or p_group_id is null
    or p_inviter_id = v_user_id then
    return false;
  end if;

  -- Los dos tienen que estar en ese grupo.
  if not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = v_user_id
  ) or not exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_inviter_id
  ) then
    return false;
  end if;

  -- Tiene que ser alguien nuevo: cuenta de menos de 7 días...
  if not exists (
    select 1 from auth.users
    where id = v_user_id
      and created_at > now() - interval '7 days'
  ) then
    return false;
  end if;

  -- ...y que todavía no haya registrado ninguna actividad.
  if exists (
    select 1 from public.activities
    where user_id = v_user_id
  ) then
    return false;
  end if;

  insert into public.referrals (
    invitee_id,
    inviter_id,
    group_id
  )
  values (
    v_user_id,
    p_inviter_id,
    p_group_id
  )
  on conflict (invitee_id) do nothing;

  get diagnostics v_inserted = row_count;

  return v_inserted > 0;
end;
$function$;

revoke all on function public.claim_referral(uuid, uuid) from public;
grant execute on function public.claim_referral(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 4. PERMITIR EL TIPO 'referral' EN social_notifications
-- ---------------------------------------------------------------------
--
-- Igual que con 'comment': contempla enum o text con CHECK.

do $$
declare
  v_udt text;
  v_typtype "char";
  r record;
begin
  select c.udt_name
    into v_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'social_notifications'
    and c.column_name = 'type';

  select t.typtype
    into v_typtype
  from pg_type t
  where t.typname = v_udt;

  if v_typtype = 'e' then
    execute format(
      'alter type public.%I add value if not exists %L',
      v_udt,
      'referral'
    );
  end if;

  for r in
    select
      con.conname,
      pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    where con.conrelid = 'public.social_notifications'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%''nudge''%'
      and pg_get_constraintdef(con.oid) not ilike '%''referral''%'
  loop
    execute format(
      'alter table public.social_notifications drop constraint %I',
      r.conname
    );

    execute format(
      'alter table public.social_notifications add constraint %I %s',
      r.conname,
      regexp_replace(
        r.def,
        '''nudge''(::[a-z ]+)?',
        '''nudge''\1, ''referral''\1'
      )
    );
  end loop;
end
$$;


-- ---------------------------------------------------------------------
-- 5. PREMIO: PRIMERA ACTIVIDAD DEL INVITADO
-- ---------------------------------------------------------------------

create or replace function public.reward_referral_on_first_activity()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_inviter_id uuid;
  v_group_id uuid;
begin
  -- Marca como entregado (una sola vez) y trae quién invitó.
  update public.referrals
  set rewarded_at = now()
  where invitee_id = new.user_id
    and rewarded_at is null
  returning inviter_id, group_id
  into v_inviter_id, v_group_id;

  if v_inviter_id is null then
    return new;
  end if;

  -- Asegura la billetera y aplica la recarga mensual pendiente.
  perform public.refresh_user_wildcards(v_inviter_id);

  -- +1 comodín, hasta 6.
  update public.user_wildcards
  set
    balance = greatest(balance, least(balance + 1, 6)),
    updated_at = now()
  where user_id = v_inviter_id;

  insert into public.social_notifications (
    recipient_user_id,
    actor_user_id,
    group_id,
    type,
    activity_id,
    emoji,
    notification_date
  )
  values (
    v_inviter_id,
    new.user_id,
    v_group_id,
    'referral',
    new.id,
    '🃏',
    new.activity_date
  );

  return new;
end;
$function$;

drop trigger if exists activities_reward_referral on public.activities;

create trigger activities_reward_referral
  after insert on public.activities
  for each row
  execute function public.reward_referral_on_first_activity();
