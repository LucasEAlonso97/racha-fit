import {
  CloudOff,
} from 'lucide-react'

/*
 * Actividad guardada sin señal que todavía
 * no se envió.
 */
function PendingBadge() {
  return (
    <div className="mt-2 flex w-fit items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-black text-sky-700">
      <CloudOff
        size={11}
        strokeWidth={3}
      />
      Sin señal · se envía sola
    </div>
  )
}

export default PendingBadge
