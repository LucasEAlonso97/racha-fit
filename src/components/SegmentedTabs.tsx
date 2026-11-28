/*
 * Pestañas de arriba de una pantalla
 * (Grupo, Progreso). Mismo estilo en toda
 * la app.
 */
export type SegmentedTab<T extends string> = {
  id: T
  label: string
  badge?: number
}

type Props<T extends string> = {
  tabs: SegmentedTab<T>[]
  active: T
  onChange: (id: T) => void
}

function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: Props<T>) {
  /*
   * Hasta 3 pestañas: parejas, en grilla.
   * Más de 3: en fila, con scroll de costado
   * si no entran.
   */
  const many = tabs.length > 3

  return (
    <div
      role="tablist"
      data-no-swipe
      className={
        many
          ? '-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]'
          : 'grid rounded-2xl bg-zinc-100 p-1'
      }
      style={
        many
          ? undefined
          : {
              gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
            }
      }
    >
      {tabs.map((tab) => {
        const selected =
          tab.id === active

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={(event) => {
              onChange(tab.id)
              // Que la pestaña elegida quede
              // a la vista si estaba cortada.
              if (many) {
                event.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'nearest',
                })
              }
            }}
            className={
              many
                ? `relative shrink-0 rounded-full px-3.5 py-2.5 text-sm font-bold transition ${
                    selected
                      ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
                      : 'bg-white text-zinc-600 shadow-sm'
                  }`
                : `relative rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                    selected
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-zinc-500'
                  }`
            }
          >
            {tab.label}

            {(tab.badge ?? 0) > 0 && (
              <span
                className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white ${
                  many ? 'ring-2 ring-[#fffaf7]' : ''
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedTabs
