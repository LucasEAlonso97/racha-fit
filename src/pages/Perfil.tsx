import {
  useEffect,
  useState,
} from 'react'

import {
  Camera,
  Check,
  Copy,
  Flame,
  LoaderCircle,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Settings,
  Target,
  Users,
  X,
} from 'lucide-react'

import AddGroupModal from '../components/AddGroupModal'
import GroupManagementModal from '../components/GroupManagementModal'
import NotificationSettings from '../components/NotificationSettings'
import UserAvatar from '../components/UserAvatar'

import type {
  ActivitiesByDate,
  Group,
  Profile,
  User,
} from '../types'

type StatsRange =
  | 'week'
  | 'month'
  | 'total'

type Props = {
  currentUser: User
  profile: Profile
  email: string

  group: Group
  members: User[]
  memberCount: number

  wildcardBalance:
    number | null

  activities:
    ActivitiesByDate

  onLogout: () => void

  onSaveProfile: (
    name: string,
    avatarUrl: string | null,
    avatarFile: File | null,
  ) => Promise<boolean>

  onSaveWeeklyGoal: (
    weeklyGoal: number,
  ) => Promise<boolean>

  onGroupReady: (
    group: Group,
  ) => void

  onGroupUpdated: (
    group: Group,
  ) => void

  onLeftGroup: (
    groupId: string,
  ) => void

  onMemberRemoved: (
    userId: string,
  ) => void
}

const avatarOptions = [
  {
    id: 'bob',
    label: 'Bob mamado',
    value: '/bob-gym.jpg',
  },
  {
    id: 'bunny',
    label: 'Conejito',
    value: '/bunny-gym.jpg',
  },
  {
    id: 'initial',
    label: 'Inicial',
    value: null,
  },
]

const weeklyGoalOptions = [
  2,
  3,
  4,
  5,
  6,
  7,
]

function Perfil({
  currentUser,
  profile,
  email,
  group,
  members,
  memberCount,
  wildcardBalance,
  activities,
  onLogout,
  onSaveProfile,
  onSaveWeeklyGoal,
  onGroupReady,
  onGroupUpdated,
  onLeftGroup,
  onMemberRemoved,
}: Props) {
  /*
   * ========================================
   * PERFIL
   * ========================================
   */

  const [
    editing,
    setEditing,
  ] =
    useState(
      false,
    )

  const [
    name,
    setName,
  ] =
    useState(
      profile.name,
    )

  const [
    avatarUrl,
    setAvatarUrl,
  ] =
    useState<
      string | null
    >(
      profile.avatar_url,
    )

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<
      File | null
    >(
      null,
    )

  const [
    avatarPreview,
    setAvatarPreview,
  ] =
    useState<
      string | null
    >(
      null,
    )

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    )

  const [
    saved,
    setSaved,
  ] =
    useState(
      false,
    )

  const [
    fileError,
    setFileError,
  ] =
    useState<
      string | null
    >(
      null,
    )

  /*
   * ========================================
   * OBJETIVO SEMANAL
   * ========================================
   */

  const [
    weeklyGoal,
    setWeeklyGoal,
  ] =
    useState(
      currentUser.weeklyGoal ??
        4,
    )

  const [
    weeklyGoalSaving,
    setWeeklyGoalSaving,
  ] =
    useState(
      false,
    )

  const [
    weeklyGoalSaved,
    setWeeklyGoalSaved,
  ] =
    useState(
      false,
    )

  /*
   * ========================================
   * ESTADÍSTICAS
   * ========================================
   */

  const [
    statsRange,
    setStatsRange,
  ] =
    useState<StatsRange>(
      'week',
    )

  /*
   * ========================================
   * MODALES DE GRUPO
   * ========================================
   */

  const [
    groupModalOpen,
    setGroupModalOpen,
  ] =
    useState(
      false,
    )

  const [
    groupManagementOpen,
    setGroupManagementOpen,
  ] =
    useState(
      false,
    )

  /*
   * ========================================
   * SINCRONIZAR PERFIL
   * ========================================
   */

  useEffect(() => {
    setName(
      profile.name,
    )

    setAvatarUrl(
      profile.avatar_url,
    )
  }, [
    profile,
  ])

  /*
   * ========================================
   * SINCRONIZAR OBJETIVO
   * ========================================
   */

  useEffect(() => {
    setWeeklyGoal(
      currentUser.weeklyGoal ??
        4,
    )

    setWeeklyGoalSaved(
      false,
    )
  }, [
    currentUser.weeklyGoal,
    group.id,
  ])

  /*
   * ========================================
   * LIMPIAR PREVIEW AVATAR
   * ========================================
   */

  useEffect(() => {
    return () => {
      if (
        avatarPreview
      ) {
        URL.revokeObjectURL(
          avatarPreview,
        )
      }
    }
  }, [
    avatarPreview,
  ])

  const clearPendingFile =
    () => {
      if (
        avatarPreview
      ) {
        URL.revokeObjectURL(
          avatarPreview,
        )
      }

      setAvatarPreview(
        null,
      )

      setAvatarFile(
        null,
      )
    }

  /*
   * ========================================
   * COPIAR CÓDIGO
   * ========================================
   */

  const copyInviteCode =
    async () => {
      try {
        await navigator.clipboard.writeText(
          group.invite_code,
        )
      } catch (
        error
      ) {
        console.error(
          'No se pudo copiar el código:',
          error,
        )
      }
    }

  /*
   * ========================================
   * CANCELAR EDICIÓN
   * ========================================
   */

  const cancelEditing =
    () => {
      clearPendingFile()

      setName(
        profile.name,
      )

      setAvatarUrl(
        profile.avatar_url,
      )

      setFileError(
        null,
      )

      setEditing(
        false,
      )
    }

  /*
   * ========================================
   * AVATAR PREDEFINIDO
   * ========================================
   */

  const selectAvatar = (
    value:
      string | null,
  ) => {
    clearPendingFile()

    setAvatarUrl(
      value,
    )

    setFileError(
      null,
    )
  }

  /*
   * ========================================
   * SUBIR AVATAR
   * ========================================
   */

  const handleAvatarFile = (
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[
        0
      ]

    if (
      !file
    ) {
      return
    }

    setFileError(
      null,
    )

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setFileError(
        'Usá una imagen JPG, PNG o WEBP.',
      )

      event.target.value =
        ''

      return
    }

    const maxSize =
      5 *
      1024 *
      1024

    if (
      file.size >
      maxSize
    ) {
      setFileError(
        'La imagen no puede pesar más de 5 MB.',
      )

      event.target.value =
        ''

      return
    }

    clearPendingFile()

    const preview =
      URL.createObjectURL(
        file,
      )

    setAvatarFile(
      file,
    )

    setAvatarPreview(
      preview,
    )

    event.target.value =
      ''
  }

  /*
   * ========================================
   * GUARDAR PERFIL
   * ========================================
   */

  const saveProfile =
    async () => {
      const cleanName =
        name.trim()

      if (
        !cleanName
      ) {
        return
      }

      setSaving(
        true,
      )

      setSaved(
        false,
      )

      const success =
        await onSaveProfile(
          cleanName,
          avatarUrl,
          avatarFile,
        )

      setSaving(
        false,
      )

      if (
        !success
      ) {
        return
      }

      clearPendingFile()

      setEditing(
        false,
      )

      setSaved(
        true,
      )

      window.setTimeout(
        () => {
          setSaved(
            false,
          )
        },
        2500,
      )
    }

  /*
   * ========================================
   * GUARDAR OBJETIVO SEMANAL
   * ========================================
   */

  const saveWeeklyGoal =
    async () => {
      if (
        weeklyGoal ===
        currentUser.weeklyGoal
      ) {
        return
      }

      setWeeklyGoalSaving(
        true,
      )

      setWeeklyGoalSaved(
        false,
      )

      const success =
        await onSaveWeeklyGoal(
          weeklyGoal,
        )

      setWeeklyGoalSaving(
        false,
      )

      if (
        !success
      ) {
        return
      }

      setWeeklyGoalSaved(
        true,
      )

      window.setTimeout(
        () => {
          setWeeklyGoalSaved(
            false,
          )
        },
        2500,
      )
    }

  /*
   * ========================================
   * PREVIEW USUARIO
   * ========================================
   */

  const previewUser:
    User = {
      ...currentUser,

      name:
        name.trim() ||
        currentUser.name,

      avatar:
        avatarPreview ??
        avatarUrl,

      fallback:
        (
          name.trim() ||
          currentUser.name
        )
          .charAt(
            0,
          )
          .toUpperCase() ||
        '?',
    }

  /*
   * ========================================
   * ESTADÍSTICAS PERSONALES
   * ========================================
   */

  const myActivities =
    Object.entries(
      activities,
    ).flatMap(
      ([
        dateKey,
        day,
      ]) =>
        (
          day[
            currentUser.id
          ] ?? []
        ).map(
          (
            activity,
          ) => ({
            ...activity,
            dateKey,
          }),
        ),
    )

  const now =
    new Date()

  now.setHours(
    23,
    59,
    59,
    999,
  )

  const startOfWeek =
    new Date()

  const currentDay =
    startOfWeek.getDay()

  const daysSinceMonday =
    currentDay ===
    0
      ? 6
      : currentDay -
        1

  startOfWeek.setDate(
    startOfWeek.getDate() -
      daysSinceMonday,
  )

  startOfWeek.setHours(
    0,
    0,
    0,
    0,
  )

  const startOfMonth =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )

  startOfMonth.setHours(
    0,
    0,
    0,
    0,
  )

  const filteredActivities =
    myActivities.filter(
      (
        activity,
      ) => {
        if (
          statsRange ===
          'total'
        ) {
          return true
        }

        const activityDate =
          new Date(
            `${activity.dateKey}T12:00:00`,
          )

        if (
          statsRange ===
          'week'
        ) {
          return (
            activityDate >=
              startOfWeek &&
            activityDate <=
              now
          )
        }

        return (
          activityDate >=
            startOfMonth &&
          activityDate <=
            now
        )
      },
    )

  const activeDays =
    new Set(
      filteredActivities.map(
        (
          activity,
        ) =>
          activity.dateKey,
      ),
    ).size

  const totalActivities =
    filteredActivities.length

  const totalMinutes =
    filteredActivities.reduce(
      (
        total,
        activity,
      ) =>
        total +
        activity.duration,
      0,
    )

  const activityCounts =
    filteredActivities.reduce<
      Record<
        string,
        number
      >
    >(
      (
        counts,
        activity,
      ) => {
        counts[
          activity.type
        ] =
          (
            counts[
              activity.type
            ] ??
            0
          ) +
          1

        return counts
      },
      {},
    )

  const favoriteActivity =
    Object.entries(
      activityCounts,
    ).sort(
      (
        a,
        b,
      ) =>
        b[1] -
        a[1],
    )[0]?.[0] ??
    '—'

  const formattedMinutes =
    totalMinutes >=
    60
      ? `${Math.floor(
          totalMinutes /
            60,
        )}h ${
          totalMinutes %
          60
        }m`
      : `${totalMinutes} min`

  const goalChanged =
    weeklyGoal !==
    currentUser.weeklyGoal

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-violet-500">
              Tu cuenta
            </p>

            <h1 className="text-3xl font-black text-zinc-800">
              Perfil
            </h1>

            <p className="mt-1 text-zinc-500">
              Vos, tus grupos y tu
              Racha 🔥
            </p>
          </div>

          {!editing ? (
            <button
              type="button"
              onClick={() =>
                setEditing(
                  true,
                )
              }
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600"
            >
              <Pencil
                size={
                  19
                }
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={
                cancelEditing
              }
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"
            >
              <X
                size={
                  19
                }
              />
            </button>
          )}
        </div>
      </header>

      {/* ================================= */}
      {/* PERFIL */}
      {/* ================================= */}

      <section className="mb-5 rounded-[30px] bg-gradient-to-br from-violet-100 to-pink-50 p-6 text-center shadow-sm">
        <div className="mx-auto w-fit">
          <div className="scale-125">
            <UserAvatar
              user={
                editing
                  ? previewUser
                  : currentUser
              }
              size="lg"
            />
          </div>
        </div>

        {editing ? (
          <div className="mt-6">
            <label className="mb-2 block text-left text-xs font-black tracking-wider text-zinc-500">
              TU NOMBRE
            </label>

            <input
              type="text"
              value={
                name
              }
              onChange={(
                event,
              ) =>
                setName(
                  event
                    .target
                    .value,
                )
              }
              maxLength={
                40
              }
              className="w-full rounded-2xl border border-white bg-white/80 px-4 py-3 text-center text-xl font-black text-zinc-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        ) : (
          <h2 className="mt-5 text-2xl font-black text-zinc-800">
            {
              currentUser.name
            }
          </h2>
        )}

        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Mail
            size={
              15
            }
          />

          {
            email
          }
        </div>

        <div className="mx-auto mt-4 w-fit rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-violet-600">
          🔥 Miembro de Racha
        </div>
      </section>

      {/* ================================= */}
      {/* OBJETIVO SEMANAL */}
      {/* ================================= */}

      <section className="mb-5 overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black tracking-wider text-violet-500">
                TU OBJETIVO
              </p>

              <h2 className="mt-1 text-xl font-black text-zinc-800">
                ¿Cuántos días
                querés moverte?
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                En{' '}
                <span className="font-bold">
                  {
                    group.name
                  }
                </span>
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Target
                size={
                  23
                }
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-6 gap-2">
            {weeklyGoalOptions.map(
              (
                goal,
              ) => {
                const selected =
                  weeklyGoal ===
                  goal

                return (
                  <button
                    key={
                      goal
                    }
                    type="button"
                    onClick={() => {
                      setWeeklyGoal(
                        goal,
                      )

                      setWeeklyGoalSaved(
                        false,
                      )
                    }}
                    className={`relative flex h-12 items-center justify-center rounded-2xl text-base font-black transition active:scale-95 ${
                      selected
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-100'
                        : 'bg-zinc-50 text-zinc-500'
                    }`}
                  >
                    {
                      goal
                    }

                    {goal ===
                      4 && (
                      <span className="absolute -top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-700">
                        ★
                      </span>
                    )}
                  </button>
                )
              },
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-violet-50 p-4">
            <p className="text-lg font-black text-violet-700">
              {
                weeklyGoal
              }{' '}
              {weeklyGoal ===
              1
                ? 'día'
                : 'días'}{' '}
              por semana
            </p>

            <p className="mt-1 text-sm leading-relaxed text-violet-500">
              {weeklyGoal <=
              3
                ? 'Un objetivo tranqui para mantener constancia.'
                : weeklyGoal ===
                    4
                  ? 'Un buen equilibrio para mantener el ritmo.'
                  : weeklyGoal <=
                      6
                    ? 'Vas por una semana bastante activa.'
                    : 'Modo todos los días. Sin descanso para la banda 😅'}
            </p>
          </div>

          {goalChanged ? (
            <button
              type="button"
              onClick={() =>
                void saveWeeklyGoal()
              }
              disabled={
                weeklyGoalSaving
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3.5 font-black text-white shadow-lg shadow-violet-100 transition active:scale-[0.98] disabled:opacity-60"
            >
              {weeklyGoalSaving ? (
                <>
                  <LoaderCircle
                    size={
                      18
                    }
                    className="animate-spin"
                  />

                  Guardando...
                </>
              ) : (
                <>
                  <Check
                    size={
                      18
                    }
                  />

                  Guardar objetivo
                </>
              )}
            </button>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-black text-green-600">
              <Check
                size={
                  16
                }
              />

              {weeklyGoalSaved
                ? 'Objetivo actualizado'
                : 'Objetivo actual'}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
          <p className="text-xs font-semibold leading-relaxed text-zinc-500">
            Este objetivo es solo
            para este grupo. Si
            tenés otro grupo,
            podés elegir una meta
            distinta.
          </p>
        </div>
      </section>

      {/* ================================= */}
      {/* COMODINES */}
      {/* ================================= */}

      <section className="mb-5 overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              🃏
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black tracking-wider text-amber-600">
                COMODINES
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-black text-zinc-800">
                  {wildcardBalance ??
                    '—'}
                </span>

                <span className="mb-1 text-sm font-bold text-zinc-500">
                  {wildcardBalance ===
                  1
                    ? 'disponible'
                    : 'disponibles'}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold leading-relaxed text-zinc-600">
            Si entrenaste pero te
            olvidaste de cargarlo,
            podés recuperar una
            actividad de los
            últimos 7 días.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-amber-100 px-5 py-4">
          <div>
            <p className="text-xs font-black text-zinc-600">
              +2 por mes
            </p>

            <p className="mt-0.5 text-[11px] font-semibold text-zinc-400">
              Se renuevan
              automáticamente
            </p>
          </div>

          <div className="h-8 w-px bg-zinc-100" />

          <div className="text-right">
            <p className="text-xs font-black text-zinc-600">
              Máximo 3
            </p>

            <p className="mt-0.5 text-[11px] font-semibold text-zinc-400">
              Podés acumularlos
            </p>
          </div>
        </div>
      </section>

      {/* ================================= */}
      {/* ESTADÍSTICAS */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-wider text-zinc-400">
              TUS NÚMEROS
            </p>

            <h2 className="mt-1 truncate text-lg font-black text-zinc-800">
              En{' '}
              {
                group.name
              }
            </h2>
          </div>

          <div className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-xl">
            📊
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'week',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-black transition ${
              statsRange ===
              'week'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            Semana
          </button>

          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'month',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-black transition ${
              statsRange ===
              'month'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            Mes
          </button>

          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'total',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-black transition ${
              statsRange ===
              'total'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            Total
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-violet-50 p-4">
            <p className="text-2xl font-black text-violet-600">
              {
                activeDays
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Días activos
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-2xl font-black text-zinc-800">
              {
                totalActivities
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Actividades
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-2xl font-black text-zinc-800">
              {
                formattedMinutes
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Tiempo activo
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="truncate text-lg font-black text-orange-600">
              {
                favoriteActivity
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Más frecuente
            </p>
          </div>
        </div>

        {totalActivities ===
          0 && (
          <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-zinc-400">
            No tenés actividades
            registradas en este
            período.
          </p>
        )}
      </section>

      {/* ================================= */}
      {/* AVATAR */}
      {/* ================================= */}

      {editing && (
        <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-xs font-black tracking-wider text-zinc-400">
            ELEGÍ TU DIBU
          </p>

          <h2 className="mt-1 text-lg font-black text-zinc-800">
            Tu avatar
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Este es el dibujito
            que aparece en el
            calendario.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {avatarOptions.map(
              (
                option,
              ) => {
                const selected =
                  !avatarFile &&
                  avatarUrl ===
                    option.value

                const optionUser:
                  User = {
                    ...currentUser,

                    name:
                      name.trim() ||
                      currentUser.name,

                    avatar:
                      option.value,

                    fallback:
                      (
                        name.trim() ||
                        currentUser.name
                      )
                        .charAt(
                          0,
                        )
                        .toUpperCase() ||
                      '?',
                  }

                return (
                  <button
                    key={
                      option.id
                    }
                    type="button"
                    onClick={() =>
                      selectAvatar(
                        option.value,
                      )
                    }
                    className={`relative rounded-2xl border p-3 transition ${
                      selected
                        ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                        : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white">
                        <Check
                          size={
                            12
                          }
                          strokeWidth={
                            3
                          }
                        />
                      </div>
                    )}

                    <div className="mx-auto w-fit">
                      <UserAvatar
                        user={
                          optionUser
                        }
                        size="lg"
                      />
                    </div>

                    <p className="mt-2 text-xs font-black text-zinc-600">
                      {
                        option.label
                      }
                    </p>
                  </button>
                )
              },
            )}
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100" />

            <span className="text-xs font-bold text-zinc-400">
              O
            </span>

            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 py-4 font-black text-violet-600 transition hover:bg-violet-100">
            <Camera
              size={
                20
              }
            />

            Subir mi propio dibu

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handleAvatarFile
              }
              className="hidden"
            />
          </label>

          {avatarFile && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-green-50 p-3">
              <UserAvatar
                user={
                  previewUser
                }
                size="md"
              />

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-black text-green-700">
                  {
                    avatarFile.name
                  }
                </p>

                <p className="text-xs text-green-600">
                  Listo para subir
                </p>
              </div>

              <Check
                size={
                  18
                }
                className="text-green-600"
              />
            </div>
          )}

          {fileError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
              {
                fileError
              }
            </div>
          )}

          <button
            type="button"
            onClick={
              saveProfile
            }
            disabled={
              saving ||
              !name.trim()
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <>
                <LoaderCircle
                  size={
                    20
                  }
                  className="animate-spin"
                />

                Guardando...
              </>
            ) : (
              'Guardar perfil 🔥'
            )}
          </button>
        </section>
      )}

      {saved && (
        <div className="mb-5 rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-bold text-green-600">
          ✓ Perfil actualizado
        </div>
      )}

      {/* ================================= */}
      {/* GRUPO ACTIVO */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black tracking-wider text-zinc-400">
            GRUPO ACTIVO
          </p>

          <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black text-green-600">
            ACTIVO
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Flame
              size={
                25
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-black text-zinc-800">
              {
                group.name
              }
            </h3>

            <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <Users
                size={
                  14
                }
              />

              {
                memberCount
              }{' '}
              {memberCount ===
              1
                ? 'integrante'
                : 'integrantes'}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs font-bold text-zinc-400">
            CÓDIGO DE INVITACIÓN
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="truncate text-xl font-black tracking-[0.15em] text-zinc-800">
              {
                group.invite_code
              }
            </span>

            <button
              type="button"
              onClick={
                copyInviteCode
              }
              title="Copiar código"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"
            >
              <Copy
                size={
                  18
                }
              />
            </button>
          </div>

          <p className="mt-2 text-xs text-zinc-400">
            Compartilo con alguien
            para sumarlo a este
            grupo.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setGroupModalOpen(
              true,
            )
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-100 py-3.5 font-black text-violet-600 transition active:scale-[0.98]"
        >
          <Plus
            size={
              18
            }
          />

          Crear o unirme a otro
          grupo
        </button>

        <button
          type="button"
          onClick={() =>
            setGroupManagementOpen(
              true,
            )
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3.5 font-black text-zinc-600 transition active:scale-[0.98]"
        >
          <Settings
            size={
              18
            }
          />

          Administrar grupo
        </button>

        <p className="mt-3 text-center text-xs font-medium text-zinc-400">
          Podés cambiar entre tus
          grupos desde arriba
        </p>
      </section>

      {/* ================================= */}
      {/* CUENTA */}
      {/* ================================= */}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-black tracking-wider text-zinc-400">
          CUENTA
        </p>

        <NotificationSettings
          userId={
            currentUser.id
          }
        />

        <button
          type="button"
          onClick={
            onLogout
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-bold text-red-500 transition active:scale-[0.98]"
        >
          <LogOut
            size={
              18
            }
          />

          Cerrar sesión
        </button>
      </section>

      <p className="mt-6 text-center text-xs font-medium text-zinc-300">
        Racha · Un día más cuenta 🏋️‍♀️
      </p>

      {/* ================================= */}
      {/* MODALES */}
      {/* ================================= */}

      <AddGroupModal
        open={
          groupModalOpen
        }
        userId={
          currentUser.id
        }
        onClose={() =>
          setGroupModalOpen(
            false,
          )
        }
        onReady={
          onGroupReady
        }
      />

      <GroupManagementModal
        open={
          groupManagementOpen
        }
        group={
          group
        }
        members={
          members
        }
        currentUserId={
          currentUser.id
        }
        onClose={() =>
          setGroupManagementOpen(
            false,
          )
        }
        onGroupUpdated={
          onGroupUpdated
        }
        onLeftGroup={
          onLeftGroup
        }
        onMemberRemoved={
          onMemberRemoved
        }
      />
    </div>
  )
}

export default Perfil