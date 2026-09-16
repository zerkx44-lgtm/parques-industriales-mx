import { motion } from 'framer-motion'
import { claseNombres } from '../lib/utiles'

interface Props {
  activo: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
  titulo?: string
}

/** Chip de filtro. Cuando está activo se pinta con el color del sector. */
export function Chip({ activo, onClick, color, children, titulo }: Props) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-pressed={activo}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={claseNombres(
        'relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        activo
          ? 'text-white border-transparent'
          : 'border-acero-200 dark:border-acero-700 text-acero-600 dark:text-acero-400 hover:border-acero-400',
      )}
      style={activo ? { backgroundColor: color ?? '#1B2A3A' } : undefined}
    >
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: activo ? 'rgba(255,255,255,.9)' : color }}
        />
      )}
      {children}
    </motion.button>
  )
}
