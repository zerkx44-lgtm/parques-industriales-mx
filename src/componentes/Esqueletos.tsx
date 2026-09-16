/** Bloques grises mientras cargan los datos. */
export function EsqueletoLista({ cantidad = 5 }: { cantidad?: number }) {
  return (
    <div className="space-y-2 p-3" aria-hidden>
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="tarjeta animate-pulse p-4">
          <div className="h-4 w-2/3 rounded bg-acero-200 dark:bg-acero-700" />
          <div className="mt-2 h-3 w-1/2 rounded bg-acero-200/70 dark:bg-acero-700/70" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 rounded-full bg-acero-200/70 dark:bg-acero-700/70" />
            <div className="h-5 w-16 rounded-full bg-acero-200/70 dark:bg-acero-700/70" />
          </div>
        </div>
      ))}
    </div>
  )
}
