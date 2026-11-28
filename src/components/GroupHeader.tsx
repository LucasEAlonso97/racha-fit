import GroupSwitcher from './GroupSwitcher'

import type {
  Group,
} from '../types'

type Props = {
  groups: Group[]
  activeGroup: Group
  onSelectGroup: (group: Group) => void

  /*
   * Comodines disponibles (null si todavía
   * no cargaron) y qué hacer al tocarlos.
   */
  wildcardBalance: number | null
  onOpenWildcards: () => void
}

/*
 * ========================================
 * BARRA DE ARRIBA
 * ========================================
 *
 * Selector de grupo y tus comodines. El
 * código de invitación está en Perfil →
 * Administrar grupo, y "Cerrar sesión" en
 * Perfil → Cuenta.
 */
function GroupHeader({
  groups,
  activeGroup,
  onSelectGroup,
  wildcardBalance,
  onOpenWildcards,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-4">
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
        <GroupSwitcher
          groups={groups}
          activeGroup={activeGroup}
          onSelectGroup={onSelectGroup}
        />

        {wildcardBalance !== null && (
          <button
            type="button"
            onClick={onOpenWildcards}
            aria-label={`Tenés ${wildcardBalance} comodines`}
            className="ml-3 flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 transition active:scale-95"
          >
            <span className="text-base leading-none">
              🃏
            </span>
            {wildcardBalance}
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupHeader
