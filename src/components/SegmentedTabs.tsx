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
  return (
    <div
      role="tablist"
      className="grid rounded-2xl bg-zinc-100 p-1"
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
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
            onClick={() =>
              onChange(tab.id)
            }
            className={`relative rounded-xl px-2 py-2.5 text-sm font-bold transition ${
              selected
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            {tab.label}

            {(tab.badge ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
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
