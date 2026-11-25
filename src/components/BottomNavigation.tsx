import type {
  LucideIcon,
} from 'lucide-react'

import {
  CalendarDays,
  Flame,
  Home,
  Plus,
  Trophy,
  UserRound,
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
}

type Tab = {
  view: View
  label: string
  Icon: LucideIcon
}

/*
 * Las 5 pestañas con el mismo ancho. El +
 * flota arriba de Rachas, más chico y más
 * alto, para no taparla.
 */
const TABS: Tab[] = [
  {
    view: 'home',
    label: 'Inicio',
    Icon: Home,
  },
  {
    view: 'calendar',
    label: 'Calendario',
    Icon: CalendarDays,
  },
  {
    view: 'rachas',
    label: 'Rachas',
    Icon: Flame,
  },
  {
    view: 'tournaments',
    label: 'Torneos',
    Icon: Trophy,
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
  onSelect,
}: {
  tab: Tab
  active: boolean
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
      className={`flex min-w-0 flex-col items-center gap-1.5 py-2 ${
        active
          ? 'text-violet-600'
          : 'text-zinc-400'
      }`}
    >
      <Icon size={22} />

      {/* 11px (antes 9). */}
      <span
        className={`whitespace-nowrap text-[11px] leading-none tracking-tight ${
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
}: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="relative mx-auto max-w-md">
        {/* BOTÓN CENTRAL */}

        <button
          type="button"
          aria-label="Agregar actividad"
          onClick={
            onAddActivity
          }
          className="absolute left-1/2 top-0 z-20 flex h-12 w-12 -translate-x-1/2 -translate-y-[38px] items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-300 ring-4 ring-white transition active:scale-95"
        >
          <Plus
            size={25}
            strokeWidth={3}
          />
        </button>

        {/* NAV */}

        <div className="grid grid-cols-5 items-center px-2 py-2">
          {TABS.map((tab) => (
            <NavTab
              key={tab.view}
              tab={tab}
              active={view === tab.view}
              onSelect={onChangeView}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

export default BottomNavigation
