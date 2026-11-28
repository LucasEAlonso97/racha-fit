import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  Bug,
  Check,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import {
  loadAdminData,
  markFeedbackRead,
  type AdminData,
  type AdminDay,
} from '../lib/admin'

import {
  monthNames,
  parseDateKey,
} from '../utils/date'

type Props = {
  onClose: () => void
  onUnreadChange?: (
    unread: number,
  ) => void
}

/*
 * ----------------------------------------
 * Ayudas de formato
 * ----------------------------------------
 */

function shortDay(dateKey: string) {
  const date = parseDateKey(dateKey)

  return `${date.getDate()} ${monthNames[
    date.getMonth()
  ].slice(0, 3)}`
}

function timeAgo(
  iso: string | null,
): string | null {
  if (!iso) {
    return null
  }

  const minutes = Math.max(
    0,
    Math.round(
      (Date.now() -
        new Date(iso).getTime()) /
        60000,
    ),
  )

  if (minutes < 2) {
    return 'recién'
  }

  if (minutes < 60) {
    return `hace ${minutes} min`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return `hace ${hours} h`
  }

  const days = Math.round(hours / 24)

  return days === 1
    ? 'ayer'
    : `hace ${days} días`
}

function daysSince(
  dateKey: string | null,
) {
  if (!dateKey) {
    return null
  }

  const today = new Date()

  today.setHours(12, 0, 0, 0)

  return Math.round(
    (today.getTime() -
      parseDateKey(dateKey).getTime()) /
      86400000,
  )
}

function activityLabel(
  dateKey: string | null,
) {
  const days = daysSince(dateKey)

  if (days === null) {
    return 'nunca entrenó'
  }

  if (days <= 0) {
    return 'entrenó hoy'
  }

  if (days === 1) {
    return 'entrenó ayer'
  }

  return `entrenó hace ${days} días`
}

function percent(
  part: number,
  total: number,
) {
  return total > 0
    ? `${Math.round((part / total) * 100)}%`
    : '—'
}

/*
 * ----------------------------------------
 * Piezas
 * ----------------------------------------
 */

function Card({
  title,
  children,
  right,
}: {
  title: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <section className="mb-4 rounded-[24px] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-wider text-violet-500">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  )
}

function Kpi({
  value,
  label,
  detail,
}: {
  value: number | string
  label: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3">
      <p className="text-2xl font-black text-zinc-800">
        {value}
      </p>
      <p className="text-xs font-bold text-zinc-500">
        {label}
      </p>
      {detail && (
        <p className="mt-0.5 text-xs font-semibold text-zinc-500">
          {detail}
        </p>
      )}
    </div>
  )
}

type DailyMetric =
  | 'opened'
  | 'trained'
  | 'signups'

const DAILY_LABELS: Record<
  DailyMetric,
  string
> = {
  opened: 'Abrieron',
  trained: 'Entrenaron',
  signups: 'Registros',
}

function DailyChart({
  days,
}: {
  days: AdminDay[]
}) {
  /*
   * Las aperturas se cuentan desde esta
   * versión: hasta tener una semana de datos,
   * arranca mostrando quiénes entrenaron.
   */
  const [metric, setMetric] =
    useState<DailyMetric>(() =>
      days.filter((day) => day.opened > 0)
        .length >= 7
        ? 'opened'
        : 'trained',
    )

  const [selected, setSelected] =
    useState(days.length - 1)

  const max = Math.max(
    1,
    ...days.map((day) => day[metric]),
  )

  const day = days[selected]

  return (
    <Card
      title="30 DÍAS"
      right={
        <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-bold">
          {(
            Object.keys(
              DAILY_LABELS,
            ) as DailyMetric[]
          ).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={metric === key}
              onClick={() =>
                setMetric(key)
              }
              className={`rounded-lg px-2 py-1 ${
                metric === key
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-zinc-500'
              }`}
            >
              {DAILY_LABELS[key]}
            </button>
          ))}
        </div>
      }
    >
      {day && (
        <p className="text-sm font-bold text-zinc-500">
          {shortDay(day.day)}:{' '}
          <span className="text-lg font-black text-zinc-800">
            {day[metric]}
          </span>{' '}
          {metric === 'signups'
            ? day.signups === 1
              ? 'registro'
              : 'registros'
            : day[metric] === 1
              ? 'persona'
              : 'personas'}
          {metric === 'trained' &&
            ` · ${day.activities} actividades`}
        </p>
      )}

      <div className="mt-3 flex h-28 items-end gap-[3px]">
        {days.map((item, index) => (
          <button
            key={item.day}
            type="button"
            aria-label={`${shortDay(item.day)}: ${item[metric]}`}
            onClick={() =>
              setSelected(index)
            }
            className="flex h-full flex-1 items-end"
          >
            <span
              className={`block w-full rounded-t ${
                index === selected
                  ? 'bg-violet-600'
                  : 'bg-violet-300'
              }`}
              style={{
                height: `${Math.max(
                  item[metric] > 0 ? 5 : 1.5,
                  (item[metric] / max) * 100,
                )}%`,
              }}
            />
          </button>
        ))}
      </div>

      <div className="mt-1 flex justify-between text-xs font-bold text-zinc-500">
        <span>
          {days[0] && shortDay(days[0].day)}
        </span>
        <span>Hoy</span>
      </div>
    </Card>
  )
}

type UserFilter =
  | 'all'
  | 'active'
  | 'asleep'

/*
 * ========================================
 * PANEL DE ADMIN
 * ========================================
 *
 * Solo se abre para quien está en
 * app_admins (la base igual lo verifica en
 * cada consulta).
 */
function AdminPanel({
  onClose,
  onUnreadChange,
}: Props) {
  const [data, setData] =
    useState<AdminData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [failed, setFailed] =
    useState(false)

  const [query, setQuery] =
    useState('')

  const [filter, setFilter] =
    useState<UserFilter>('all')

  /*
   * Momento de la última carga (para
   * calcular "hace cuánto").
   */
  const [loadedAt, setLoadedAt] =
    useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)

    const result = await loadAdminData()

    setData(result)
    setLoadedAt(Date.now())
    setFailed(!result)
    setLoading(false)

    if (result) {
      onUnreadChange?.(
        result.overview.feedback_unread,
      )
    }
  }, [onUnreadChange])

  useEffect(() => {
    // Carga inicial del panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const users = useMemo(() => {
    if (!data) {
      return []
    }

    const text = query
      .trim()
      .toLowerCase()

    return data.users.filter((user) => {
      if (
        text &&
        !(user.name ?? '')
          .toLowerCase()
          .includes(text)
      ) {
        return false
      }

      const sinceActivity = daysSince(
        user.last_activity,
      )

      const seenDaysAgo =
        user.last_seen_at
          ? (loadedAt -
              new Date(
                user.last_seen_at,
              ).getTime()) /
            86400000
          : null

      const recent =
        (sinceActivity !== null &&
          sinceActivity < 7) ||
        (seenDaysAgo !== null &&
          seenDaysAgo < 7)

      if (filter === 'active') {
        return recent
      }

      if (filter === 'asleep') {
        return !recent
      }

      return true
    })
  }, [data, query, filter, loadedAt])

  const markRead = async (
    id: string,
  ) => {
    if (!data) {
      return
    }

    const ok = await markFeedbackRead(id)

    if (!ok) {
      return
    }

    const feedback = data.feedback.map(
      (item) =>
        item.id === id
          ? {
              ...item,
              read_at:
                new Date().toISOString(),
            }
          : item,
    )

    const unread = feedback.filter(
      (item) => !item.read_at,
    ).length

    setData({
      ...data,
      feedback,
      overview: {
        ...data.overview,
        feedback_unread: unread,
      },
    })

    onUnreadChange?.(unread)
  }

  const overview = data?.overview

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel de admin"
      className="fixed inset-0 z-[120] overflow-y-auto overscroll-contain bg-[#f6f3ff]"
    >
      <div className="mx-auto max-w-md px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[max(env(safe-area-inset-top),16px)]">
        {/* Encabezado */}

        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 bg-[#f6f3ff]/95 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-bold tracking-wider text-violet-500">
              SOLO VOS
            </p>
            <h2 className="text-2xl font-black text-zinc-800">
              Panel de Racha
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Actualizar"
              onClick={() => void load()}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? 'animate-spin'
                    : undefined
                }
              />
            </button>

            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading && !data && (
          <div className="flex justify-center py-20">
            <LoaderCircle
              size={30}
              className="animate-spin text-violet-400"
            />
          </div>
        )}

        {failed && !loading && (
          <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-zinc-500">
            No pudimos cargar el panel.
            Revisá que la migración del
            panel esté corrida y que tu
            cuenta esté en app_admins.
          </p>
        )}

        {data && overview && (
          <>
            {/* Números */}

            <Card title="QUIÉN LA USA">
              <div className="grid grid-cols-3 gap-2">
                <Kpi
                  value={
                    overview.opened_today
                  }
                  label="Hoy"
                  detail={`${overview.trained_today} entrenaron`}
                />
                <Kpi
                  value={
                    overview.opened_7d
                  }
                  label="7 días"
                  detail={`${overview.trained_7d} entrenaron`}
                />
                <Kpi
                  value={
                    overview.opened_30d
                  }
                  label="30 días"
                  detail={`${overview.trained_30d} entrenaron`}
                />
              </div>

              <p className="mt-2 text-xs font-semibold text-zinc-500">
                Personas que abrieron la
                app
                {overview.usage_since
                  ? ` (se cuenta desde el ${shortDay(overview.usage_since)})`
                  : ' (se empieza a contar con esta versión)'}
                .
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Kpi
                  value={
                    overview.users_total
                  }
                  label="Usuarios"
                  detail={`+${overview.signups_7d} esta semana`}
                />
                <Kpi
                  value={`${overview.groups_active_7d}/${overview.groups_total}`}
                  label="Grupos activos"
                  detail="últimos 7 días"
                />
                <Kpi
                  value={
                    overview.activities_7d
                  }
                  label="Actividades"
                  detail="últimos 7 días"
                />
              </div>
            </Card>

            {/* Día por día */}

            {data.daily.length > 0 && (
              <DailyChart
                days={data.daily}
              />
            )}

            {/* Retención */}

            <Card title="¿VUELVEN?">
              <p className="mb-3 text-xs font-semibold text-zinc-500">
                De los que se registraron
                cada semana, cuántos
                volvieron a usarla 1, 2 y 4
                semanas después.
              </p>

              {data.retention.length ===
              0 ? (
                <p className="text-sm font-semibold text-zinc-500">
                  Sin registros en las
                  últimas 12 semanas.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                      <th className="pb-2">
                        Semana
                      </th>
                      <th className="pb-2 text-center">
                        Nuevos
                      </th>
                      <th className="pb-2 text-center">
                        1 sem
                      </th>
                      <th className="pb-2 text-center">
                        2 sem
                      </th>
                      <th className="pb-2 text-center">
                        4 sem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.retention.map(
                      (row) => {
                        const age =
                          daysSince(
                            row.cohort_week,
                          ) ?? 0

                        /*
                         * Si todavía no pasó
                         * ese tiempo, "—".
                         */
                        const cell = (
                          value: number,
                          weeks: number,
                        ) =>
                          age >=
                          weeks * 7 + 13
                            ? percent(
                                value,
                                row.users,
                              )
                            : '—'

                        return (
                          <tr
                            key={
                              row.cohort_week
                            }
                            className="border-t border-zinc-100 font-bold text-zinc-700"
                          >
                            <td className="py-2">
                              {shortDay(
                                row.cohort_week,
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {row.users}
                            </td>
                            <td className="py-2 text-center">
                              {cell(
                                row.week1,
                                1,
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {cell(
                                row.week2,
                                2,
                              )}
                            </td>
                            <td className="py-2 text-center">
                              {cell(
                                row.week4,
                                4,
                              )}
                            </td>
                          </tr>
                        )
                      },
                    )}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Sugerencias */}

            <Card
              title="SUGERENCIAS"
              right={
                overview.feedback_unread >
                0 ? (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    {
                      overview.feedback_unread
                    }{' '}
                    sin leer
                  </span>
                ) : undefined
              }
            >
              {data.feedback.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-500">
                  Todavía nadie mandó
                  nada.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.feedback.map(
                    (item) => (
                      <div
                        key={item.id}
                        className={`rounded-2xl p-3 ${
                          item.read_at
                            ? 'bg-zinc-50'
                            : 'bg-amber-50 ring-1 ring-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                          {item.kind ===
                          'idea' ? (
                            <Lightbulb
                              size={13}
                              className="text-amber-500"
                            />
                          ) : (
                            <Bug
                              size={13}
                              className="text-rose-500"
                            />
                          )}
                          {item.user_name}
                          <span className="font-semibold text-zinc-500">
                            ·{' '}
                            {timeAgo(
                              item.created_at,
                            )}
                            {item.app_version &&
                              ` · v${item.app_version}`}
                          </span>
                        </div>

                        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-zinc-700">
                          {item.message}
                        </p>

                        {!item.read_at && (
                          <button
                            type="button"
                            onClick={() =>
                              void markRead(
                                item.id,
                              )
                            }
                            className="mt-2 flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-bold text-violet-600 shadow-sm"
                          >
                            <Check
                              size={13}
                            />
                            Marcar leída
                          </button>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </Card>

            {/* Usuarios */}

            <Card
              title={`USUARIOS (${users.length})`}
            >
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar por nombre"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm font-semibold text-zinc-700 outline-none focus:border-violet-400"
                />
              </div>

              <div className="mt-2 flex gap-1.5 text-xs font-bold">
                {(
                  [
                    ['all', 'Todos'],
                    [
                      'active',
                      'Activos (7 días)',
                    ],
                    ['asleep', 'Dormidos'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={
                      filter === value
                    }
                    onClick={() =>
                      setFilter(value)
                    }
                    className={`rounded-xl px-2.5 py-1.5 ${
                      filter === value
                        ? 'bg-violet-500 text-white'
                        : 'bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <ul className="mt-3 divide-y divide-zinc-100">
                {users.map((user) => (
                  <li
                    key={user.user_id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-600">
                        {(user.name ?? '?')
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-800">
                        {user.name ??
                          'Sin nombre'}
                      </p>
                      <p className="truncate text-xs font-semibold text-zinc-500">
                        {user.last_seen_at
                          ? `abrió ${timeAgo(user.last_seen_at)}`
                          : 'no abrió desde que se mide'}{' '}
                        ·{' '}
                        {activityLabel(
                          user.last_activity,
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-zinc-700">
                        {user.activities_30d}
                      </p>
                      <p className="text-xs font-bold uppercase text-zinc-500">
                        en 30 d
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {users.length === 0 && (
                <p className="py-4 text-center text-sm font-semibold text-zinc-500">
                  Nadie con ese filtro.
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default AdminPanel
