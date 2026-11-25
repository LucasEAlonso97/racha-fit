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
 * 3 a la izquierda y 2 a la derecha del
 * botón "+", que queda en el centro con su
 * propio espacio (antes tapaba Rachas).
 */
const LEFT_TABS: Tab[] = [
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
]

const RIGHT_TABS: Tab[] = [
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

      {/*
        * 11px (antes 9). "Calendario" puede
        * ocupar un poquito del espacio de sus
        * vecinas, que tienen nombres cortos.
        */}
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
          className="absolute left-1/2 top-0 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-7 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-200 ring-4 ring-white transition active:scale-95"
        >
          <Plus
            size={29}
            strokeWidth={3}
          />
        </button>

        {/* NAV */}

        <div className="flex items-center py-2">
          <div className="grid flex-1 grid-cols-3">
            {LEFT_TABS.map((tab) => (
              <NavTab
                key={tab.view}
                tab={tab}
                active={view === tab.view}
                onSelect={onChangeView}
              />
            ))}
          </div>

          {/* Lugar del + */}
          <div
            aria-hidden="true"
            className="w-14 shrink-0"
          />

          <div className="grid flex-1 grid-cols-2">
            {RIGHT_TABS.map((tab) => (
              <NavTab
                key={tab.view}
                tab={tab}
                active={view === tab.view}
                onSelect={onChangeView}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default BottomNavigation
