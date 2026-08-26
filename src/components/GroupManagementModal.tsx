import {
  useEffect,
  useState,
} from 'react'

import {
  Check,
  Copy,
  Crown,
  LoaderCircle,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  UserMinus,
  Users,
  X,
} from 'lucide-react'

import {
  supabase,
} from '../lib/supabase'

import type {
  Group,
  User,
} from '../types'

import UserAvatar from './UserAvatar'

type Props = {
  open: boolean
  group: Group
  members: User[]
  currentUserId: string

  onClose: () => void

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

function GroupManagementModal({
  open,
  group,
  members,
  currentUserId,
  onClose,
  onGroupUpdated,
  onLeftGroup,
  onMemberRemoved,
}: Props) {
  const isOwner =
    group.created_by ===
    currentUserId

  const [
    editingName,
    setEditingName,
  ] = useState(false)

  const [
    groupName,
    setGroupName,
  ] = useState(
    group.name,
  )

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    copied,
    setCopied,
  ] = useState(false)

  const [
    regeneratingCode,
    setRegeneratingCode,
  ] = useState(false)

  const [
    leaving,
    setLeaving,
  ] = useState(false)

  const [
    removingUserId,
    setRemovingUserId,
  ] = useState<
    string | null
  >(null)

  const [
    deletingGroup,
    setDeletingGroup,
  ] = useState(false)

  /*
   * ========================================
   * SINCRONIZAR GRUPO
   * ========================================
   */

  useEffect(() => {
    setGroupName(
      group.name,
    )

    setEditingName(
      false,
    )

    setError(
      null,
    )

    setCopied(
      false,
    )
  }, [
    group.id,
    group.name,
    group.invite_code,
  ])

  if (!open) {
    return null
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

        setCopied(true)

        window.setTimeout(
          () => {
            setCopied(false)
          },
          1800,
        )
      } catch (caughtError) {
        console.error(
          'Error copiando código:',
          caughtError,
        )
      }
    }

  /*
   * ========================================
   * REGENERAR CÓDIGO
   * ========================================
   */

  const regenerateInviteCode =
    async () => {
      if (!isOwner) {
        return
      }

      const confirmed =
        window.confirm(
          '¿Generar un nuevo código de invitación?\n\nEl código actual dejará de funcionar.',
        )

      if (!confirmed) {
        return
      }

      setRegeneratingCode(
        true,
      )

      setError(null)

      const {
        data,
        error:
          regenerateError,
      } =
        await supabase.rpc(
          'regenerate_group_invite_code',
          {
            _group_id:
              group.id,
          },
        )

      setRegeneratingCode(
        false,
      )

      if (
        regenerateError ||
        !data
      ) {
        console.error(
          'Error regenerando código:',
          regenerateError,
        )

        setError(
          'No pudimos generar un nuevo código.',
        )

        return
      }

      const newCode =
        String(data)

      onGroupUpdated({
        ...group,
        invite_code:
          newCode,
      })

      setCopied(false)
    }

  /*
   * ========================================
   * CAMBIAR NOMBRE
   * ========================================
   */

  const saveGroupName =
    async () => {
      if (!isOwner) {
        return
      }

      const cleanName =
        groupName.trim()

      if (!cleanName) {
        setError(
          'El grupo necesita un nombre.',
        )

        return
      }

      if (
        cleanName ===
        group.name
      ) {
        setEditingName(
          false,
        )

        return
      }

      setSaving(true)
      setError(null)

      const {
        data,
        error:
          updateError,
      } =
        await supabase
          .from('groups')
          .update({
            name:
              cleanName,
          })
          .eq(
            'id',
            group.id,
          )
          .eq(
            'created_by',
            currentUserId,
          )
          .select(
            'id, name, invite_code, created_by',
          )
          .single()

      setSaving(false)

      if (
        updateError ||
        !data
      ) {
        console.error(
          'Error actualizando grupo:',
          updateError,
        )

        setError(
          'No pudimos cambiar el nombre del grupo.',
        )

        return
      }

      const updatedGroup =
        data as Group

      onGroupUpdated(
        updatedGroup,
      )

      setGroupName(
        updatedGroup.name,
      )

      setEditingName(
        false,
      )
    }

  const cancelNameEditing =
    () => {
      setGroupName(
        group.name,
      )

      setEditingName(
        false,
      )

      setError(
        null,
      )
    }

  /*
   * ========================================
   * ABANDONAR GRUPO
   * ========================================
   */

  const leaveGroup =
    async () => {
      if (isOwner) {
        return
      }

      const confirmed =
        window.confirm(
          `¿Querés abandonar "${group.name}"?\n\nTus actividades dentro de este grupo se eliminarán.`,
        )

      if (!confirmed) {
        return
      }

      setLeaving(true)
      setError(null)

      const {
        error:
          leaveError,
      } =
        await supabase.rpc(
          'leave_group',
          {
            _group_id:
              group.id,
          },
        )

      setLeaving(false)

      if (leaveError) {
        console.error(
          'Error abandonando grupo:',
          leaveError,
        )

        setError(
          'No pudimos abandonar el grupo.',
        )

        return
      }

      onClose()

      onLeftGroup(
        group.id,
      )
    }

  /*
   * ========================================
   * EXPULSAR MIEMBRO
   * ========================================
   */

  const removeMember =
    async (
      member: User,
    ) => {
      if (
        !isOwner ||
        member.id ===
          currentUserId
      ) {
        return
      }

      const confirmed =
        window.confirm(
          `¿Quitar a ${member.name} de "${group.name}"?\n\nSus actividades dentro de este grupo se eliminarán.`,
        )

      if (!confirmed) {
        return
      }

      setRemovingUserId(
        member.id,
      )

      setError(null)

      const {
        error:
          removeError,
      } =
        await supabase.rpc(
          'remove_group_member',
          {
            _group_id:
              group.id,

            _user_id:
              member.id,
          },
        )

      setRemovingUserId(
        null,
      )

      if (removeError) {
        console.error(
          'Error quitando integrante:',
          removeError,
        )

        setError(
          'No pudimos quitar al integrante.',
        )

        return
      }

      onMemberRemoved(
        member.id,
      )
    }

  /*
   * ========================================
   * ELIMINAR GRUPO
   * ========================================
   */

  const deleteGroup =
    async () => {
      if (!isOwner) {
        return
      }

      const confirmation =
        window.prompt(
          `Esta acción no se puede deshacer.\n\nPara eliminar "${group.name}", escribí el nombre del grupo:`,
        )

      if (
        confirmation?.trim() !==
        group.name
      ) {
        if (
          confirmation !==
          null
        ) {
          window.alert(
            'El nombre no coincide. No eliminamos nada.',
          )
        }

        return
      }

      setDeletingGroup(
        true,
      )

      setError(null)

      const {
        error:
          deleteError,
      } =
        await supabase.rpc(
          'delete_group',
          {
            _group_id:
              group.id,
          },
        )

      setDeletingGroup(
        false,
      )

      if (deleteError) {
        console.error(
          'Error eliminando grupo:',
          deleteError,
        )

        setError(
          'No pudimos eliminar el grupo.',
        )

        return
      }

      onClose()

      onLeftGroup(
        group.id,
      )
    }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/30 px-4 pb-4 sm:items-center">
      {/* FONDO */}

      <button
        type="button"
        aria-label="Cerrar"
        onClick={
          onClose
        }
        className="absolute inset-0"
      />

      {/* MODAL */}

      <section className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[30px] bg-zinc-50 p-5 shadow-2xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-wider text-violet-500">
              TU RACHA
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-800">
              Administrar grupo
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Integrantes y
              configuración.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ================================= */}
        {/* GRUPO */}
        {/* ================================= */}

        <section className="mb-4 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black tracking-wider text-zinc-400">
                GRUPO
              </p>

              {!editingName ? (
                <h3 className="mt-1 truncate text-xl font-black text-zinc-800">
                  {group.name}
                </h3>
              ) : (
                <input
                  type="text"
                  value={
                    groupName
                  }
                  maxLength={40}
                  onChange={(
                    event,
                  ) =>
                    setGroupName(
                      event
                        .target
                        .value,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 font-black text-zinc-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
              )}
            </div>

            {isOwner &&
              !editingName && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingName(
                      true,
                    )
                  }
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600"
                >
                  <Pencil
                    size={17}
                  />
                </button>
              )}
          </div>

          {editingName && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={
                  cancelNameEditing
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-2xl bg-zinc-100 py-3 text-sm font-black text-zinc-500"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  saveGroupName
                }
                disabled={
                  saving ||
                  !groupName.trim()
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={17}
                  />
                )}

                Guardar
              </button>
            </div>
          )}

          <div className="mt-4">
            {isOwner ? (
              <div className="flex w-fit items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-600">
                <Crown
                  size={14}
                />

                Administrás este grupo
              </div>
            ) : (
              <div className="w-fit rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-black text-zinc-500">
                Miembro
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
              {error}
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* INTEGRANTES */}
        {/* ================================= */}

        <section className="mb-4 rounded-[26px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black tracking-wider text-zinc-400">
                INTEGRANTES
              </p>

              <h3 className="mt-1 font-black text-zinc-800">
                La banda
              </h3>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-600">
              <Users
                size={14}
              />

              {members.length}
            </div>
          </div>

          <div className="space-y-3">
            {members.map(
              (member) => {
                const memberIsOwner =
                  member.id ===
                  group.created_by

                const isMe =
                  member.id ===
                  currentUserId

                const removing =
                  removingUserId ===
                  member.id

                return (
                  <div
                    key={
                      member.id
                    }
                    className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3"
                  >
                    <UserAvatar
                      user={
                        member
                      }
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-zinc-800">
                        {isMe
                          ? 'Vos'
                          : member.name}
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-zinc-400">
                        {memberIsOwner
                          ? 'Administrador'
                          : 'Miembro'}
                      </p>
                    </div>

                    {memberIsOwner ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                        <Crown
                          size={16}
                        />
                      </div>
                    ) : (
                      isOwner &&
                      !isMe && (
                        <button
                          type="button"
                          disabled={
                            removing
                          }
                          onClick={() =>
                            removeMember(
                              member,
                            )
                          }
                          title="Quitar del grupo"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 disabled:opacity-50"
                        >
                          {removing ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <UserMinus
                              size={17}
                            />
                          )}
                        </button>
                      )
                    )}
                  </div>
                )
              },
            )}
          </div>
        </section>

        {/* ================================= */}
        {/* INVITACIÓN */}
        {/* ================================= */}

        <section className="mb-4 rounded-[26px] bg-white p-5 shadow-sm">
          <p className="text-xs font-black tracking-wider text-zinc-400">
            INVITACIÓN
          </p>

          <h3 className="mt-1 font-black text-zinc-800">
            Sumá gente 🔥
          </h3>

          <div className="mt-4 rounded-2xl bg-violet-50 p-4">
            <p className="text-xs font-bold text-violet-400">
              CÓDIGO DEL GRUPO
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="truncate text-xl font-black tracking-[0.15em] text-violet-700">
                {
                  group.invite_code
                }
              </span>

              <button
                type="button"
                onClick={
                  copyInviteCode
                }
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-violet-600 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check
                      size={16}
                    />

                    Copiado
                  </>
                ) : (
                  <>
                    <Copy
                      size={16}
                    />

                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* REGENERAR CÓDIGO */}

          {isOwner && (
            <>
              <button
                type="button"
                onClick={
                  regenerateInviteCode
                }
                disabled={
                  regeneratingCode
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3.5 text-sm font-black text-zinc-600 transition active:scale-[0.98] disabled:opacity-50"
              >
                {regeneratingCode ? (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw
                    size={18}
                  />
                )}

                {regeneratingCode
                  ? 'Generando...'
                  : 'Regenerar código'}
              </button>

              <p className="mt-2 text-center text-xs font-medium text-zinc-400">
                El código anterior
                dejará de funcionar.
              </p>
            </>
          )}
        </section>

        {/* ================================= */}
        {/* ABANDONAR GRUPO */}
        {/* ================================= */}

        {!isOwner && (
          <section className="rounded-[26px] bg-white p-5 shadow-sm">
            <p className="text-xs font-black tracking-wider text-red-400">
              SALIR DEL GRUPO
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Vas a dejar de formar
              parte de esta Racha.
            </p>

            <button
              type="button"
              disabled={
                leaving
              }
              onClick={
                leaveGroup
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-black text-red-500 disabled:opacity-50"
            >
              {leaving ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <LogOut
                  size={18}
                />
              )}

              {leaving
                ? 'Saliendo...'
                : 'Abandonar grupo'}
            </button>
          </section>
        )}

        {/* AVISO ADMIN */}

        {isOwner && (
          <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-xs font-semibold text-yellow-700">
            👑 Como administrador no
            podés abandonar este grupo.
          </div>
        )}

        {/* ================================= */}
        {/* ZONA DELICADA */}
        {/* ================================= */}

        {isOwner && (
          <section className="mt-4 rounded-[26px] border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black tracking-wider text-red-400">
              ZONA DELICADA
            </p>

            <h3 className="mt-1 font-black text-zinc-800">
              Eliminar esta Racha
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Se eliminarán el grupo,
              sus integrantes y todas
              las actividades guardadas.
              Esta acción no se puede
              deshacer.
            </p>

            <button
              type="button"
              onClick={
                deleteGroup
              }
              disabled={
                deletingGroup
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-black text-red-500 transition active:scale-[0.98] disabled:opacity-50"
            >
              {deletingGroup ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />

                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2
                    size={18}
                  />

                  Eliminar grupo
                </>
              )}
            </button>
          </section>
        )}
      </section>
    </div>
  )
}

export default GroupManagementModal