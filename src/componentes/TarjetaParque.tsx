import { motion } from 'framer-motion'
import type { Parque } from '../lib/tipos'
import { COLOR_SECTOR, ETIQUETA_SECTOR, ICONO_SERVICIO, ETIQUETA_SERVICIO } from '../lib/tipos'
import { claseNombres, formatearHectareas } from '../lib/utiles'

interface Props {
  parque: Parque
  resaltado: boolean
  seleccionado: boolean
  onSeleccionar: () => void
  onResaltar: (id: string | null) => void
}

export function TarjetaParque({
  parque,
  resaltado,
  seleccionado,
  onSeleccionar,
  onResaltar,
}: Props) {
  const color = COLOR_SECTOR[parque.sector]

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      onMouseEnter={() => onResaltar(parque.id)}
      onMouseLeave={() => onResaltar(null)}
      onFocus={() => onResaltar(parque.id)}
      onBlur={() => onResaltar(null)}
    >
      <button
        type="button"
        onClick={onSeleccionar}
        aria-current={seleccionado ? 'true' : undefined}
        className={claseNombres(
          'tarjeta group relative w-full overflow-hidden p-4 text-left transition-shadow',
          resaltado || seleccionado
            ? 'shadow-lg ring-2 ring-ambar'
            : 'hover:shadow-md hover:border-acero-400/60',
        )}
      >
        <span
          className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-acero-800 dark:text-white">
              {parque.nombre}
            </h3>
            <p className="mt-0.5 truncate text-sm text-acero-600 dark:text-acero-400">
              {parque.municipio}, {parque.estado}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-1 text-[11px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {ETIQUETA_SECTOR[parque.sector]}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1" aria-label="Servicios disponibles">
            {parque.servicios.map((s) => (
              <span
                key={s}
                title={ETIQUETA_SERVICIO[s]}
                className="rounded-md bg-acero-200/60 px-1.5 py-0.5 text-xs dark:bg-acero-800"
              >
                <span aria-hidden>{ICONO_SERVICIO[s]}</span>
                <span className="sr-only">{ETIQUETA_SERVICIO[s]}</span>
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs font-semibold text-acero-400">
            {formatearHectareas(parque.hectareas)}
          </span>
        </div>
      </button>
    </motion.li>
  )
}
