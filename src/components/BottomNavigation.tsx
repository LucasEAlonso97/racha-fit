import {
  CalendarDays,
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

function BottomNavigation({
  view,
  onChangeView,
  onAddActivity,
}: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-3 py-2">
        <button
          onClick={() =>
            onChangeView('home')
          }
          className={`flex flex-col items-center gap-1 py-2 ${
            view === 'home'
              ? 'text-violet-600'
              : 'text-zinc-400'
          }`}
        >
          <Home size={22} />

          <span className="text-[10px] font-bold">
            Inicio
          </span>
        </button>

        <button
          onClick={() =>
            onChangeView('calendar')
          }
          className={`flex flex-col items-center gap-1 py-2 ${
            view === 'calendar'
              ? 'text-violet-600'
              : 'text-zinc-400'
          }`}
        >
          <CalendarDays size={22} />

          <span className="text-[10px] font-semibold">
            Calendario
          </span>
        </button>

        <button
          aria-label="Agregar actividad"
          onClick={onAddActivity}
          className="-mt-8 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-200 transition active:scale-95"
        >
          <Plus
            size={32}
            strokeWidth={3}
          />
        </button>

        <button
          onClick={() =>
            onChangeView('rachas')
          }
          className={`flex flex-col items-center gap-1 py-2 ${
            view === 'rachas'
              ? 'text-violet-600'
              : 'text-zinc-400'
          }`}
        >
          <Trophy size={22} />

          <span className="text-[10px] font-semibold">
            Rachas
          </span>
        </button>

        <button
          onClick={() =>
            onChangeView('profile')
          }
          className={`flex flex-col items-center gap-1 py-2 ${
            view === 'profile'
              ? 'text-violet-600'
              : 'text-zinc-400'
          }`}
        >
          <UserRound size={22} />

          <span className="text-[10px] font-semibold">
            Perfil
          </span>
        </button>
      </div>
    </nav>
  )
}

export default BottomNavigation