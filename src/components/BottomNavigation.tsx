import type {
  LucideIcon,
} from 'lucide-react'

import {
  ChartNoAxesColumnIncreasing,
  Home,
  Plus,
  UserRound,
  Users,
} from 'lucide-react'

import type {
  View,
} from '../types'

type Props = {
  view: View

  onChangeView: (
    view: View,
  ) => void

  onAddActivity: () => void

  /*
   * Numerito arriba de una pestaña (por
   * ejemplo, regalos para reclamar en
   * Progreso).
   */
  badges?: Partial<Record<View, number>>
}

type Tab = {
  view: View
  label: string
  Icon: LucideIcon
}

/*
 * Inicio · Grupo · [+] · Progreso · Perfil
 *
 * Dos pestañas a cada lado y el + en el
 * medio, con su propio lugar: no tapa nada.
 */
const LEFT: Tab[] = [
  {
    view: 'home',
    label: 'Inicio',
    Icon: Home,
  },
  {
    view: 'group',
    label: 'Grupo',
    Icon: Users,
  },
]

const RIGHT: Tab[] = [
  {
    view: 'progress',
    label: 'Progreso',
    Icon: ChartNoAxesColumnIncreasing,
  },
  {
    view: 'profile',
    label: 'Perfil',
    Icon: UserRound,
  },
]

function NavTab({
  tab,
  active,
  badge,
  onSelect,
}: {
  tab: Tab
  active: boolean
  badge: number
  onSelect: (view: View) => void
}) {
  const { Icon } = tab

  return (
    <button
      type="button"
      aria-current={
        active ? 'page' : undefined
      }
      onClick={() =>
        onSelect(tab.view)
      }
      className={`flex min-w-0 flex-col items-center gap-1 py-2 ${
        active
          ? 'text-violet-600'
          : 'text-zinc-500'
      }`}
    >
      <span className="relative">
        <Icon
          size={23}
          strokeWidth={
            active ? 2.5 : 2
          }
        />

        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold leading-none text-white ring-2 ring-white">
            {badge}
          </span>
        )}
      </span>

      <span
        className={`text-xs leading-none ${
          active
            ? 'font-bold'
            : 'font-semibold'
        }`}
      >
        {tab.label}
      </span>
    </button>
  )
}

function BottomNavigation({
  view,
  onChangeView,
  onAddActivity,
  badges = {},
}: Props) {
  const renderTab = (tab: Tab) => (
    <NavTab
      key={tab.view}
      tab={tab}
      active={view === tab.view}
      badge={badges[tab.view] ?? 0}
      onSelect={onChangeView}
    />
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2 py-1.5">
        {LEFT.map(renderTab)}

        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Agregar actividad"
            onClick={onAddActivity}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-200 transition active:scale-95"
          >
            <Plus
              size={26}
              strokeWidth={3}
            />
          </button>
        </div>

        {RIGHT.map(renderTab)}
      </div>
    </nav>
  )
}

export default BottomNavigation
