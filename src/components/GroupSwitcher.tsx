import {
  Check,
  ChevronDown,
  Flame,
  X,
} from 'lucide-react'

import {
  useState,
} from 'react'

import type {
  Group,
} from '../types'

type Props = {
  groups: Group[]
  activeGroup: Group
  onSelectGroup: (
    group: Group,
  ) => void
}

function GroupSwitcher({
  groups,
  activeGroup,
  onSelectGroup,
}: Props) {
  const [
    open,
    setOpen,
  ] = useState(false)

  const handleSelect = (
    group: Group,
  ) => {
    onSelectGroup(group)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="min-w-0 text-left"
      >
        <p className="text-[10px] font-black tracking-wider text-zinc-400">
          TU RACHA
        </p>

        <div className="mt-0.5 flex items-center gap-1">
          <p className="truncate font-black text-zinc-800">
            🔥 {activeGroup.name}
          </p>

          {groups.length > 1 && (
            <ChevronDown
              size={16}
              className="shrink-0 text-zinc-400"
            />
          )}
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 px-4 pb-4 sm:items-center">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() =>
              setOpen(false)
            }
            className="absolute inset-0"
          />

          <section className="relative z-10 w-full max-w-md rounded-[30px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-black tracking-wider text-violet-500">
                  MIS GRUPOS
                </p>

                <h2 className="mt-1 text-2xl font-black text-zinc-800">
                  Cambiar Racha
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Elegí el grupo que
                  querés ver.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {groups.map(
                (group) => {
                  const isActive =
                    group.id ===
                    activeGroup.id

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        handleSelect(
                          group,
                        )
                      }
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                        isActive
                          ? 'border-violet-200 bg-violet-50'
                          : 'border-zinc-100 bg-zinc-50'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? 'bg-violet-500 text-white'
                            : 'bg-white text-orange-500'
                        }`}
                      >
                        <Flame
                          size={23}
                          className={
                            isActive
                              ? 'fill-orange-300 text-orange-300'
                              : 'fill-orange-100'
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-zinc-800">
                          {group.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-zinc-400">
                          {group.created_by ===
                          activeGroup.created_by
                            ? 'Grupo de Racha'
                            : 'Grupo de Racha'}
                        </p>
                      </div>

                      {isActive && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white">
                          <Check
                            size={17}
                          />
                        </div>
                      )}
                    </button>
                  )
                },
              )}
            </div>

            {groups.length === 1 && (
              <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-500">
                  Por ahora estás en un
                  solo grupo.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default GroupSwitcher