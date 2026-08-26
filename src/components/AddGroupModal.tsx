import {
  useState,
} from 'react'

import {
  Flame,
  KeyRound,
  LoaderCircle,
  Plus,
  Users,
  X,
} from 'lucide-react'

import {
  supabase,
} from '../lib/supabase'

import type {
  Group,
} from '../types'

type Mode =
  | 'create'
  | 'join'

type Props = {
  open: boolean
  userId: string

  onClose: () => void

  onReady: (
    group: Group,
  ) => void
}

function AddGroupModal({
  open,
  userId,
  onClose,
  onReady,
}: Props) {
  const [
    mode,
    setMode,
  ] =
    useState<Mode>(
      'create',
    )

  const [
    groupName,
    setGroupName,
  ] =
    useState('')

  const [
    inviteCode,
    setInviteCode,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null)

  if (!open) {
    return null
  }

  const resetAndClose =
    () => {
      setGroupName('')
      setInviteCode('')
      setError(null)
      setLoading(false)
      setMode('create')

      onClose()
    }

  const changeMode = (
    newMode: Mode,
  ) => {
    setMode(newMode)
    setError(null)
  }

  /*
   * ========================================
   * CREAR GRUPO
   * ========================================
   */

  const createGroup =
    async () => {
      const cleanName =
        groupName.trim()

      if (!cleanName) {
        setError(
          'Poné un nombre para el grupo.',
        )

        return
      }

      setLoading(true)
      setError(null)

      const {
        data,
        error:
          createError,
      } =
        await supabase
          .from('groups')
          .insert({
            name:
              cleanName,

            created_by:
              userId,
          })
          .select(
            'id, name, invite_code, created_by',
          )
          .single()

      if (
        createError ||
        !data
      ) {
        console.error(
          'Error creando grupo:',
          createError,
        )

        setError(
          'No pudimos crear el grupo.',
        )

        setLoading(false)

        return
      }

      onReady(
        data as Group,
      )

      resetAndClose()
    }

  /*
   * ========================================
   * UNIRSE
   * ========================================
   */

  const joinGroup =
    async () => {
      const cleanCode =
        inviteCode
          .trim()
          .toUpperCase()

      if (!cleanCode) {
        setError(
          'Ingresá el código del grupo.',
        )

        return
      }

      setLoading(true)
      setError(null)

      const {
        data:
          groupId,
        error:
          joinError,
      } =
        await supabase.rpc(
          'join_group_by_code',
          {
            _invite_code:
              cleanCode,
          },
        )

      if (
        joinError ||
        !groupId
      ) {
        console.error(
          'Error uniéndose al grupo:',
          joinError,
        )

        setError(
          'Ese código no existe o no pudimos unirnos al grupo.',
        )

        setLoading(false)

        return
      }

      const {
        data:
          groupData,
        error:
          groupError,
      } =
        await supabase
          .from('groups')
          .select(
            'id, name, invite_code, created_by',
          )
          .eq(
            'id',
            groupId,
          )
          .single()

      if (
        groupError ||
        !groupData
      ) {
        console.error(
          'Error cargando grupo:',
          groupError,
        )

        setError(
          'Entraste al grupo, pero no pudimos cargarlo.',
        )

        setLoading(false)

        return
      }

      onReady(
        groupData as Group,
      )

      resetAndClose()
    }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/30 px-4 pb-4 sm:items-center">
      {/* FONDO */}

      <button
        type="button"
        aria-label="Cerrar"
        onClick={
          resetAndClose
        }
        className="absolute inset-0"
      />

      {/* MODAL */}

      <section className="relative z-10 w-full max-w-md rounded-[30px] bg-white p-5 shadow-2xl">
        {/* HEADER */}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Flame
                size={24}
                className="fill-orange-200"
              />
            </div>

            <p className="text-xs font-black tracking-wider text-violet-500">
              MIS GRUPOS
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-800">
              Nueva Racha
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Creá otro grupo o
              unite al de alguien.
            </p>
          </div>

          <button
            type="button"
            onClick={
              resetAndClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODOS */}

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() =>
              changeMode(
                'create',
              )
            }
            className={`rounded-xl py-3 text-sm font-black transition ${
              mode ===
              'create'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            Crear grupo
          </button>

          <button
            type="button"
            onClick={() =>
              changeMode(
                'join',
              )
            }
            className={`rounded-xl py-3 text-sm font-black transition ${
              mode ===
              'join'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-400'
            }`}
          >
            Tengo código
          </button>
        </div>

        {/* CREAR */}

        {mode ===
          'create' && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Users
                  size={21}
                />
              </div>

              <div>
                <p className="font-black text-zinc-800">
                  Crear otro grupo
                </p>

                <p className="text-xs text-zinc-500">
                  Vas a ser el
                  administrador.
                </p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-black tracking-wider text-zinc-500">
              NOMBRE DEL GRUPO
            </label>

            <input
              type="text"
              value={
                groupName
              }
              onChange={(
                event,
              ) =>
                setGroupName(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Team Calistenia"
              maxLength={40}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />

            <button
              type="button"
              onClick={
                createGroup
              }
              disabled={
                loading
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <Plus
                  size={20}
                />
              )}

              Crear grupo
            </button>
          </>
        )}

        {/* UNIRSE */}

        {mode ===
          'join' && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-500">
                <KeyRound
                  size={21}
                />
              </div>

              <div>
                <p className="font-black text-zinc-800">
                  Unirme a un grupo
                </p>

                <p className="text-xs text-zinc-500">
                  Usá el código que
                  te compartieron.
                </p>
              </div>
            </div>

            <label className="mb-2 block text-xs font-black tracking-wider text-zinc-500">
              CÓDIGO
            </label>

            <input
              type="text"
              value={
                inviteCode
              }
              onChange={(
                event,
              ) =>
                setInviteCode(
                  event
                    .target
                    .value
                    .toUpperCase(),
                )
              }
              placeholder="A7B3F921"
              maxLength={8}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-center text-xl font-black uppercase tracking-[0.25em] outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
            />

            <button
              type="button"
              onClick={
                joinGroup
              }
              disabled={
                loading
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading && (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              )}

              Unirme al grupo 🔥
            </button>
          </>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
            {error}
          </div>
        )}
      </section>
    </div>
  )
}

export default AddGroupModal