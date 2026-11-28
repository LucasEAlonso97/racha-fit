import {
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

import {
  formatTimeLeft,
  getTimeLeft,
} from '../lib/tournamentTime'

type Props = {
  groupId: string
  currentUserId: string
  onGoToTournaments: () => void
}

type Reminder = {
  key: string
  kind: 'choose' | 'continue'
  deadline: string | null
}

/*
 * ========================================
 * "TE TOCA ELEGIR EL TORNEO"
 * ========================================
 *
 * Al abrir la app, si es tu turno de
 * elegir carta (o de arrancar el próximo
 * torneo), aparece una sola vez por
 * torneo con el tiempo que queda antes
 * de que se elija solo.
 *
 * Pedir el torneo actual además dispara
 * el arranque automático de la base si
 * ya pasaron las 48 h.
 */

function wasShown(key: string) {
  try {
    return (
      window.localStorage.getItem(key) ===
      '1'
    )
  } catch {
    return true
  }
}

function markShown(key: string) {
  try {
    window.localStorage.setItem(key, '1')
  } catch {
    // Sin storage: no se repite en esta sesión igual.
  }
}

function TurnReminderModal({
  groupId,
  currentUserId,
  onGoToTournaments,
}: Props) {
  const [reminder, setReminder] =
    useState<Reminder | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      const { data, error } =
        await supabase.rpc(
          'get_current_tournament',
          {
            p_group_id: groupId,
          },
        )

      if (cancelled || error || !data) {
        return
      }

      const tournament = data as {
        id: string
        status: string
        selector_user_id: string | null
        next_selector_user_id: string | null
        selection_deadline?: string | null
      }

      const kind =
        tournament.status ===
          'waiting_selection' &&
        tournament.selector_user_id ===
          currentUserId
          ? 'choose'
          : tournament.status ===
                'finished' &&
              tournament.next_selector_user_id ===
                currentUserId
            ? 'continue'
            : null

      if (!kind) {
        return
      }

      const key = `racha-turn-reminder-${tournament.id}-${kind}`

      if (wasShown(key)) {
        return
      }

      setReminder({
        key,
        kind,
        deadline:
          tournament.selection_deadline ??
          null,
      })
    }

    void check()

    return () => {
      cancelled = true
    }
  }, [groupId, currentUserId])

  if (!reminder) {
    return null
  }

  const close = () => {
    markShown(reminder.key)
    setReminder(null)
  }

  const timeLeft = getTimeLeft(
    reminder.deadline,
  )

  return (
    <div
      className="fixed inset-0 z-[76] flex items-center justify-center bg-black/40 px-6 backdrop-blur-[2px]"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white text-center shadow-xl"
      >
        <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 px-6 pb-6 pt-8 text-white">
          <div className="mx-auto flex w-fit gap-1.5">
            {['-rotate-12', '', 'rotate-12'].map(
              (rotation, index) => (
                <div
                  key={index}
                  className={`flex h-16 w-11 items-center justify-center rounded-xl border-2 border-white/60 bg-white/20 text-xl font-black shadow-lg ${rotation}`}
                >
                  ?
                </div>
              ),
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black">
            {reminder.kind === 'choose'
              ? '¡Te toca elegir el torneo!'
              : '¡Te toca arrancar el próximo torneo!'}
          </h2>
        </div>

        <div className="px-6 pb-6 pt-5">
          {timeLeft !== null && (
            <p className="text-sm font-semibold leading-relaxed text-zinc-500">
              Tenés{' '}
              <span className="font-bold text-violet-600">
                {formatTimeLeft(timeLeft)}
              </span>
              . Si no, se elige una
              carta al azar para que el
              grupo no quede esperando.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              close()
              onGoToTournaments()
            }}
            className="mt-5 w-full rounded-2xl bg-violet-500 py-4 font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
          >
            {reminder.kind === 'choose'
              ? 'Elegir carta 🎴'
              : 'Ir a Torneos'}
          </button>

          <button
            type="button"
            onClick={close}
            className="mt-2 w-full py-2 text-sm font-bold text-zinc-500"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  )
}

export default TurnReminderModal
