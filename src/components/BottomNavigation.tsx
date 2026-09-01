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

function BottomNavigation({
  view,
  onChangeView,
  onAddActivity,
}: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 backdrop-blur">
      <div className="relative mx-auto max-w-md">
        {/* BOTÓN CENTRAL */}

        <button
          type="button"
          aria-label="Agregar actividad"
          onClick={
            onAddActivity
          }
          className="absolute left-1/2 top-0 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-7 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-200 transition active:scale-95"
        >
          <Plus
            size={
              29
            }
            strokeWidth={
              3
            }
          />
        </button>

        {/* NAV */}

        <div className="grid grid-cols-5 items-center px-2 py-2">
          {/* INICIO */}

          <button
            type="button"
            onClick={() =>
              onChangeView(
                'home',
              )
            }
            className={`flex flex-col items-center gap-1 py-2 ${
              view ===
              'home'
                ? 'text-violet-600'
                : 'text-zinc-400'
            }`}
          >
            <Home
              size={
                21
              }
            />

            <span className="text-[9px] font-bold">
              Inicio
            </span>
          </button>

          {/* CALENDARIO */}

          <button
            type="button"
            onClick={() =>
              onChangeView(
                'calendar',
              )
            }
            className={`flex flex-col items-center gap-1 py-2 ${
              view ===
              'calendar'
                ? 'text-violet-600'
                : 'text-zinc-400'
            }`}
          >
            <CalendarDays
              size={
                21
              }
            />

            <span className="text-[9px] font-semibold">
              Calendario
            </span>
          </button>

          {/* RACHAS */}

          <button
            type="button"
            onClick={() =>
              onChangeView(
                'rachas',
              )
            }
            className={`flex flex-col items-center gap-1 py-2 ${
              view ===
              'rachas'
                ? 'text-violet-600'
                : 'text-zinc-400'
            }`}
          >
            <Flame
              size={
                21
              }
            />

            <span className="text-[9px] font-semibold">
              Rachas
            </span>
          </button>

          {/* TORNEOS */}

          <button
            type="button"
            onClick={() =>
              onChangeView(
                'tournaments',
              )
            }
            className={`flex flex-col items-center gap-1 py-2 ${
              view ===
              'tournaments'
                ? 'text-violet-600'
                : 'text-zinc-400'
            }`}
          >
            <Trophy
              size={
                21
              }
            />

            <span className="text-[9px] font-semibold">
              Torneos
            </span>
          </button>

          {/* PERFIL */}

          <button
            type="button"
            onClick={() =>
              onChangeView(
                'profile',
              )
            }
            className={`flex flex-col items-center gap-1 py-2 ${
              view ===
              'profile'
                ? 'text-violet-600'
                : 'text-zinc-400'
            }`}
          >
            <UserRound
              size={
                21
              }
            />

            <span className="text-[9px] font-semibold">
              Perfil
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default BottomNavigation