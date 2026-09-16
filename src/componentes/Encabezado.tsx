import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTema } from '../hooks/useTema'

export function Encabezado({ accion }: { accion?: React.ReactNode }) {
  const { alternar, esOscuro } = useTema()

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="z-[900] flex items-center justify-between gap-4 border-b border-acero-200 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-acero-800 dark:bg-acero-950/85 sm:px-6"
    >
      <Link to="/" className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-acero-800 dark:bg-ambar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={esOscuro ? '#0E1720' : '#F2B705'} strokeWidth="2.2" strokeLinejoin="round">
            <path d="M3 21V10l6 4V10l6 4V6l6 4v11H3Z" />
          </svg>
        </span>
        <span className="leading-none">
          <span className="block text-[17px] font-extrabold tracking-tight text-acero-800 dark:text-white sm:text-xl">
            Parques Industriales
            <span className="ml-1 text-ambar">MX</span>
          </span>
          <span className="hidden text-xs text-acero-400 sm:block">
            Directorio nacional de parques y corredores industriales
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        {accion}
        <button
          type="button"
          onClick={alternar}
          aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="rounded-lg border border-acero-200 p-2 text-acero-600 transition-colors hover:bg-acero-200/40 dark:border-acero-700 dark:text-acero-400 dark:hover:bg-acero-800"
        >
          {esOscuro ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
      </div>
    </motion.header>
  )
}
