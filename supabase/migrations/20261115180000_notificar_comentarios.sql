-- =====================================================================
-- Racha · Notificar comentarios
-- =====================================================================
--
-- Requiere haber corrido antes 20261115120000_fotos_y_comentarios.sql.
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.
--
-- Cuando alguien comenta tu actividad, te llega una notificación
-- en "Novedades", igual que con las reacciones (type = 'comment',
-- emoji = '💬').
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PERMITIR EL TIPO 'comment' EN social_notifications
-- ---------------------------------------------------------------------
--
-- No sabemos si "type" es un enum o un text con CHECK, así que
-- contemplamos los dos casos.

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

  -- Caso enum
  if v_typtype = 'e' then
    execute format(
      'alter type public.%I add value if not exists %L',
      v_udt,
      'comment'
    );
  end if;

  -- Caso CHECK (type in ('reaction', 'nudge'))
  for r in
    select
      con.conname,
      pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    where con.conrelid = 'public.social_notifications'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%''nudge''%'
      and pg_get_constraintdef(con.oid) not ilike '%''comment''%'
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
        '''nudge''\1, ''comment''\1'
      )
    );
  end loop;
end
$$;


-- ---------------------------------------------------------------------
-- 2. TRIGGER: AL COMENTAR, AVISAR AL DUEÑO DE LA ACTIVIDAD
-- ---------------------------------------------------------------------
--
-- security definer: inserta la notificación para otra persona,
-- cosa que las políticas RLS normales no permiten.

create or replace function public.notify_activity_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity record;
begin
  select a.user_id, a.group_id, a.activity_date
    into v_activity
  from public.activities a
  where a.id = new.activity_id;

  -- Actividad inexistente o comentario propio: nada que avisar.
  if not found or v_activity.user_id = new.user_id then
    return new;
  end if;

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
    v_activity.user_id,
    new.user_id,
    v_activity.group_id,
    'comment',
    new.activity_id,
    '💬',
    v_activity.activity_date
  );

  return new;
end;
$$;

drop trigger if exists activity_comments_notify on public.activity_comments;

create trigger activity_comments_notify
  after insert on public.activity_comments
  for each row
  execute function public.notify_activity_comment();
