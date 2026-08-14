import {
  useState,
} from 'react'

import {
  Flame,
  KeyRound,
  LoaderCircle,
  LogOut,
  Plus,
  Users,
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
  userId: string
  userName: string
  onReady: (
    group: Group,
  ) => void
  onLogout: () => void
}

function GroupSetup({
  userId,
  userName,
  onReady,
  onLogout,
}: Props) {
  const [
    mode,
    setMode,
  ] =
    useState<Mode>('create')

  const [
    groupName,
    setGroupName,
  ] = useState('')

  const [
    inviteCode,
    setInviteCode,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

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
            name: cleanName,
            created_by:
              userId,
          })
          .select(
            'id, name, invite_code, created_by',
          )
          .single()

      if (createError) {
        console.error(
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

      setLoading(false)
    }

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

      setLoading(false)
    }

  const changeMode = (
    newMode: Mode,
  ) => {
    setMode(newMode)
    setError(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* HEADER */}

        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-violet-500 shadow-xl shadow-violet-200">
            <Flame
              size={42}
              className="fill-orange-300 text-orange-300"
            />
          </div>

          <p className="text-sm font-bold text-violet-500">
            Hola, {userName} 👋
          </p>

          <h1 className="mt-1 text-3xl font-black text-zinc-800">
            Armemos tu Racha
          </h1>

          <p className="mt-2 text-zinc-500">
            Creá un grupo o unite al
            de tus amigos.
          </p>
        </header>

        {/* CARD */}

        <section className="rounded-[32px] bg-white p-6 shadow-sm">
          {/* MODOS */}

          <div className="mb-7 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
            <button
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
              <div className="mb-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Users
                    size={27}
                  />
                </div>

                <h2 className="text-2xl font-black text-zinc-800">
                  Creá tu grupo
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Después te damos un
                  código para pasarle a
                  los demás.
                </p>
              </div>

              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Nombre del grupo
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
                placeholder="Los Gordos Fitness"
                maxLength={40}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <button
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

                Crear mi Racha
              </button>
            </>
          )}

          {/* UNIRSE */}

          {mode ===
            'join' && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-pink-500">
                  <KeyRound
                    size={27}
                  />
                </div>

                <h2 className="text-2xl font-black text-zinc-800">
                  Unite a una Racha
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Pedile el código a
                  alguien que ya esté en
                  el grupo.
                </p>
              </div>

              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Código
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

        <button
          onClick={
            onLogout
          }
          className="mx-auto mt-6 flex items-center gap-2 text-sm font-bold text-zinc-400"
        >
          <LogOut
            size={16}
          />

          Cerrar sesión
        </button>
      </div>
    </main>
  )
}

export default GroupSetup