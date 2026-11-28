import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react'

import {
  Camera,
  Check,
  Copy,
  Flame,
  LoaderCircle,
  BarChart3,
  LogOut,
  MessageCircleHeart,
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
import ConsistencyProgress from '../components/ConsistencyProgress'
import FeedbackModal from '../components/FeedbackModal'
import InfoTip from '../components/InfoTip'
import SegmentedTabs from '../components/SegmentedTabs'

type ProfileTab =
  | 'me'
  | 'goal'
  | 'wild'
  | 'groups'
  | 'account'

import {
  useIsAdmin,
} from '../hooks/useIsAdmin'

import {
  retryImport,
} from '../lib/appVersion'

/*
 * El panel solo lo abre el admin: se baja
 * recién cuando lo abre.
 */
const AdminPanel = lazy(() =>
  retryImport(
    () => import('../components/AdminPanel'),
  ),
)

import type {
  ActivitiesByDate,
  Group,
  Profile,
  User,
} from '../types'

type Props = {
  currentUser: User
  profile: Profile
  email: string

  group: Group
  members: User[]
  memberCount: number

  wildcardBalance:
    number | null

  consistencyRun:
    number | null

  consistencyAtCap: boolean

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
  consistencyRun,
  consistencyAtCap,
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
   * Sugerencias y panel de admin.
   */
  const [feedbackOpen, setFeedbackOpen] =
    useState(false)

  const [profileTab, setProfileTab] =
    useState<ProfileTab>('me')

  const [adminOpen, setAdminOpen] =
    useState(false)

  const [adminUnread, setAdminUnread] =
    useState(0)

  const isAdmin = useIsAdmin(
    currentUser.id,
  )

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

  const goalChanged =
    weeklyGoal !==
    currentUser.weeklyGoal

  /*
   * ========================================
   * UI
   * ========================================
   */

  /*
   * Pestaña elegida: cada sección del
   * perfil vive en la suya.
   */
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-7">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-zinc-800">
              Perfil
            </h1>
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

      <div className="mb-5">
        <SegmentedTabs
          tabs={[
            { id: 'me', label: 'Perfil' },
            { id: 'goal', label: 'Meta' },
            { id: 'wild', label: 'Comodines' },
            { id: 'groups', label: 'Grupos' },
            { id: 'account', label: 'Cuenta' },
          ]}
          active={profileTab}
          onChange={setProfileTab}
        />
      </div>

      {profileTab === 'me' && (
      <>
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
            <label className="mb-2 block text-left text-xs font-bold tracking-wider text-zinc-500">
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

      </>
      )}

      {profileTab === 'goal' && (
      <>
      {/* ================================= */}
      {/* OBJETIVO SEMANAL */}
      {/* ================================= */}

      <section className="mb-5 overflow-hidden rounded-[28px] bg-white shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-violet-500">
                TU OBJETIVO
              </p>

              <h2 className="mt-1 flex items-center gap-1 text-xl font-black text-zinc-800">
                Días por semana
                <InfoTip
                  text={`Tu meta en ${group.name}. En cada grupo podés tener una distinta.`}
                />
              </h2>
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
                    className={`relative flex h-12 items-center justify-center rounded-2xl text-base font-bold transition active:scale-95 ${
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
                      <span className="absolute -top-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3.5 font-bold text-white shadow-lg shadow-violet-100 transition active:scale-[0.98] disabled:opacity-60"
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
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-bold text-green-600">
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

      </section>

      </>
      )}

      {profileTab === 'wild' && (
      <>
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
              <p className="flex items-center gap-1 text-xs font-bold tracking-wider text-amber-600">
                COMODINES
                <InfoTip
                  text="Si entrenaste y te olvidaste de cargarlo, recuperás un día de la última semana. Se suman 2 por mes (hasta 3), y hasta 6 con premios."
                />
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

        </div>

        <ConsistencyProgress
          run={consistencyRun}
          atCap={consistencyAtCap}
          user={currentUser}
          activities={activities}
        />
      </section>




      </>
      )}

      {profileTab === 'me' && (
      <>
      {/* ================================= */}
      {/* AVATAR */}
      {/* ================================= */}

      {editing && (
        <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wider text-zinc-500">
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

                    <p className="mt-2 text-xs font-bold text-zinc-600">
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

            <span className="text-xs font-bold text-zinc-500">
              O
            </span>

            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 py-4 font-bold text-violet-600 transition hover:bg-violet-100">
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
                <p className="truncate text-sm font-bold text-green-700">
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-50"
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

      </>
      )}

      {profileTab === 'groups' && (
      <>
      {/* ================================= */}
      {/* GRUPO ACTIVO */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-wider text-zinc-500">
            GRUPO ACTIVO
          </p>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
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
            <h3 className="truncate font-bold text-zinc-800">
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
          <p className="text-xs font-bold text-zinc-500">
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

          <p className="mt-2 text-xs text-zinc-500">
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-100 py-3.5 font-bold text-violet-600 transition active:scale-[0.98]"
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3.5 font-bold text-zinc-600 transition active:scale-[0.98]"
        >
          <Settings
            size={
              18
            }
          />

          Administrar grupo
        </button>

        <p className="mt-3 text-center text-xs font-semibold text-zinc-500">
          Podés cambiar entre tus
          grupos desde arriba
        </p>
      </section>

      </>
      )}

      {profileTab === 'account' && (
      <>
      {/* ================================= */}
      {/* CUENTA */}
      {/* ================================= */}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold tracking-wider text-zinc-500">
          CUENTA
        </p>

        <NotificationSettings
          userId={
            currentUser.id
          }
        />

        <button
          type="button"
          onClick={() =>
            setFeedbackOpen(true)
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-50 py-3.5 font-bold text-violet-600 transition active:scale-[0.98]"
        >
          <MessageCircleHeart
            size={18}
          />
          Sugerir o reportar algo
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() =>
              setAdminOpen(true)
            }
            className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 font-bold text-white transition active:scale-[0.98]"
          >
            <BarChart3 size={18} />
            Panel de admin

            {adminUnread > 0 && (
              <span className="absolute right-3 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold">
                {adminUnread}
              </span>
            )}
          </button>
        )}

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

      {feedbackOpen && (
        <FeedbackModal
          onClose={() =>
            setFeedbackOpen(false)
          }
        />
      )}

      {adminOpen && (
        <Suspense fallback={null}>
          <AdminPanel
            onClose={() =>
              setAdminOpen(false)
            }
            onUnreadChange={
              setAdminUnread
            }
          />
        </Suspense>
      )}

      <p className="mt-6 text-center text-xs font-semibold text-zinc-400">
        Racha · Un día más cuenta 🏋️‍♀️
      </p>

      <p className="mt-1 text-center text-xs font-semibold text-zinc-400">
        Versión {__APP_VERSION__}
      </p>

      </>
      )}

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