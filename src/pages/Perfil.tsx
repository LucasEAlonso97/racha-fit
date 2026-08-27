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
  Users,
  X,
} from 'lucide-react'

import AddGroupModal from '../components/AddGroupModal'
import GroupManagementModal from '../components/GroupManagementModal'
import NotificationSettings from '../components/NotificationSettings'
import UserAvatar from '../components/UserAvatar'

import type {
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

  onLogout: () => void

  onSaveProfile: (
    name: string,
    avatarUrl: string | null,
    avatarFile: File | null,
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

function Perfil({
  currentUser,
  profile,
  email,
  group,
  members,
  memberCount,
  onLogout,
  onSaveProfile,
  onGroupReady,
  onGroupUpdated,
  onLeftGroup,
  onMemberRemoved,
}: Props) {
  /*
   * ========================================
   * EDICIÓN DEL PERFIL
   * ========================================
   */

  const [
    editing,
    setEditing,
  ] = useState(false)

  const [
    name,
    setName,
  ] = useState(
    profile.name,
  )

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState<
    string | null
  >(
    profile.avatar_url,
  )

  const [
    avatarFile,
    setAvatarFile,
  ] = useState<File | null>(
    null,
  )

  const [
    avatarPreview,
    setAvatarPreview,
  ] = useState<
    string | null
  >(null)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saved,
    setSaved,
  ] = useState(false)

  const [
    fileError,
    setFileError,
  ] = useState<
    string | null
  >(null)

  /*
   * ========================================
   * MODALES DE GRUPO
   * ========================================
   */

  const [
    groupModalOpen,
    setGroupModalOpen,
  ] = useState(false)

  const [
    groupManagementOpen,
    setGroupManagementOpen,
  ] = useState(false)

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
  }, [profile])

  /*
   * ========================================
   * LIMPIAR PREVIEW
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
  }, [avatarPreview])

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
   * COPIAR INVITACIÓN
   * ========================================
   */

  const copyInviteCode =
    async () => {
      try {
        await navigator.clipboard.writeText(
          group.invite_code,
        )
      } catch (error) {
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

      setEditing(false)
    }

  /*
   * ========================================
   * AVATAR PREDEFINIDO
   * ========================================
   */

  const selectAvatar = (
    value: string | null,
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
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) {
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
      5 * 1024 * 1024

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

      if (!cleanName) {
        return
      }

      setSaving(true)
      setSaved(false)

      const success =
        await onSaveProfile(
          cleanName,
          avatarUrl,
          avatarFile,
        )

      setSaving(false)

      if (!success) {
        return
      }

      clearPendingFile()

      setEditing(false)
      setSaved(true)

      window.setTimeout(
        () => {
          setSaved(false)
        },
        2500,
      )
    }

  /*
   * ========================================
   * PREVIEW USUARIO
   * ========================================
   */

  const previewUser: User =
    {
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
          .charAt(0)
          .toUpperCase() ||
        '?',
    }

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
                size={19}
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
                size={19}
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
              maxLength={40}
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
            size={15}
          />

          {email}
        </div>

        <div className="mx-auto mt-4 w-fit rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-violet-600">
          🔥 Miembro de Racha
        </div>
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
            Este es el dibujito que
            aparece en el calendario.
          </p>

          {/* PREDEFINIDOS */}

          <div className="mt-5 grid grid-cols-3 gap-3">
            {avatarOptions.map(
              (option) => {
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
                        .charAt(0)
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
                          size={12}
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

          {/* SUBIR FOTO */}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-100" />

            <span className="text-xs font-bold text-zinc-400">
              O
            </span>

            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 py-4 font-black text-violet-600 transition hover:bg-violet-100">
            <Camera
              size={20}
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
                size={18}
                className="text-green-600"
              />
            </div>
          )}

          {fileError && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
              {fileError}
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
                  size={20}
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

      {/* PERFIL GUARDADO */}

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
              size={25}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-black text-zinc-800">
              {group.name}
            </h3>

            <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <Users
                size={14}
              />

              {memberCount}{' '}
              {memberCount === 1
                ? 'integrante'
                : 'integrantes'}
            </div>
          </div>
        </div>

        {/* CÓDIGO */}

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
                size={18}
              />
            </button>
          </div>

          <p className="mt-2 text-xs text-zinc-400">
            Compartilo con alguien
            para sumarlo a este grupo.
          </p>
        </div>

        {/* CREAR / UNIRSE */}

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
            size={18}
          />

          Crear o unirme a otro grupo
        </button>

        {/* ADMINISTRAR */}

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
            size={18}
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
            size={18}
          />

          Cerrar sesión
        </button>
      </section>

      <p className="mt-6 text-center text-xs font-medium text-zinc-300">
        Racha · Un día más cuenta 🏋️‍♀️
      </p>

      {/* ================================= */}
      {/* MODAL CREAR / UNIRSE */}
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

      {/* ================================= */}
      {/* MODAL ADMINISTRAR GRUPO */}
      {/* ================================= */}

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