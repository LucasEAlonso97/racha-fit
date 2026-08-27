import {
  CheckCircle2,
  Link2,
  LoaderCircle,
  Users,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

import type {
  Group,
} from '../types'

type Props = {
  inviteCode: string
  existingGroup?: Group | null

  onReady: (
    group: Group,
  ) => void

  onCancel: () => void
}

function InviteJoin({
  inviteCode,
  existingGroup = null,
  onReady,
  onCancel,
}: Props) {
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

  const joinGroup =
    async () => {
      /*
       * Si ya pertenece al grupo,
       * simplemente lo abrimos.
       */

      if (existingGroup) {
        onReady(
          existingGroup,
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
              inviteCode,
          },
        )

      if (
        joinError ||
        !groupId
      ) {
        console.error(
          'Error uniéndose por link:',
          joinError,
        )

        setError(
          'Esta invitación ya no es válida o no pudimos encontrar el grupo.',
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

      setLoading(false)
    }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 via-zinc-50 to-pink-100 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <img
            src="/racha-192.png"
            alt="Racha"
            className="mx-auto h-16 w-16 rounded-[22px] object-cover shadow-sm"
          />

          <p className="mt-5 text-sm font-black text-violet-500">
            INVITACIÓN
          </p>

          <h1 className="mt-1 text-3xl font-black text-zinc-800">
            Te invitaron a una Racha
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
            Sumate al grupo y empiecen
            a motivarse juntos.
          </p>
        </div>

        <section className="rounded-[32px] bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-100 text-violet-600">
            <Users
              size={30}
            />
          </div>

          <div className="mt-5 text-center">
            {existingGroup ? (
              <>
                <p className="text-xs font-black tracking-wider text-zinc-400">
                  GRUPO
                </p>

                <h2 className="mt-1 text-2xl font-black text-zinc-800">
                  {
                    existingGroup.name
                  }
                </h2>

                <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-black text-green-600">
                  <CheckCircle2
                    size={15}
                  />

                  Ya sos parte
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-black tracking-wider text-zinc-400">
                  CÓDIGO DE INVITACIÓN
                </p>

                <p className="mt-2 text-xl font-black tracking-[0.15em] text-violet-600">
                  {inviteCode}
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-relaxed text-red-500">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void joinGroup()
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />

                Uniéndote...
              </>
            ) : existingGroup ? (
              <>
                <Link2
                  size={20}
                />

                Abrir grupo
              </>
            ) : (
              <>
                <Users
                  size={20}
                />

                Unirme al grupo
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={
              onCancel
            }
            className="mt-4 w-full text-sm font-bold text-zinc-400"
          >
            Ahora no
          </button>
        </section>
      </div>
    </main>
  )
}

export default InviteJoin