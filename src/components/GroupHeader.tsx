import {
  Copy,
  LogOut,
} from 'lucide-react'

import GroupSwitcher from './GroupSwitcher'

import type {
  Group,
} from '../types'

type Props = {
  groups: Group[]
  activeGroup: Group
  onSelectGroup: (group: Group) => void
  onLogout: () => void
}

/*
 * ========================================
 * HEADER DEL GRUPO
 * ========================================
 *
 * Selector de grupo, código de invitación
 * (tocar para copiar) y botón de salir.
 */

function GroupHeader({
  groups,
  activeGroup,
  onSelectGroup,
  onLogout,
}: Props) {
  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(
        activeGroup.invite_code,
      )
    } catch (error) {
      console.error(
        'No se pudo copiar:',
        error,
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-4">
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <GroupSwitcher
          groups={groups}
          activeGroup={activeGroup}
          onSelectGroup={onSelectGroup}
        />

        <button
          type="button"
          onClick={copyInviteCode}
          title="Copiar código"
          className="ml-3 flex shrink-0 items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-600"
        >
          <Copy size={14} />

          {activeGroup.invite_code}
        </button>
      </div>

      {groups.length > 1 && (
        <p className="mt-2 text-left text-[11px] font-semibold text-zinc-400">
          Tenés {groups.length} grupos ·
          tocá el nombre para cambiar
        </p>
      )}

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 text-xs font-bold text-zinc-400 transition hover:text-red-400"
        >
          <LogOut size={13} />
          Salir
        </button>
      </div>
    </div>
  )
}

export default GroupHeader
