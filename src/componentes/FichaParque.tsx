import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Parque } from '../lib/tipos'
import {
  COLOR_SECTOR,
  ETIQUETA_SECTOR,
  ETIQUETA_SERVICIO,
  ICONO_SERVICIO,
} from '../lib/tipos'
import { formatearHectareas, urlComoLlegar } from '../lib/utiles'

interface Props {
  parque: Parque | null
  onCerrar: () => void
  /** En celular entra desde abajo; en escritorio desde la derecha. */
  esMovil: boolean
}

export function FichaParque({ parque, onCerrar, esMovil }: Props) {
  // Cerrar con Escape.
  useEffect(() => {
    if (!parque) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [parque, onCerrar])

  const desde = esMovil ? { y: '100%' } : { x: '100%' }
  const hasta = esMovil ? { y: 0 } : { x: 0 }

  return (
    <AnimatePresence>
      {parque && (
        <>
          <motion.div
            className="fixed inset-0 z-[1100] bg-acero-950/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha de ${parque.nombre}`}
            initial={desde}
            animate={hasta}
            exit={desde}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag={esMovil ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (esMovil && info.offset.y > 120) onCerrar()
            }}
            className="scroll-fino fixed z-[1101] overflow-y-auto overscroll-contain bg-white shadow-2xl dark:bg-acero-900
                       inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl
                       sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-2xl"
          >
            {/* Asa para arrastrar en celular */}
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-acero-900/90">
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-acero-200 dark:bg-acero-700 sm:hidden" />
              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
                <div className="min-w-0">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                    style={{ backgroundColor: COLOR_SECTOR[parque.sector] }}
                  >
                    {ETIQUETA_SECTOR[parque.sector]}
                  </span>
                  <h2 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight text-acero-800 dark:text-white">
                    {parque.nombre}
                  </h2>
                  <p className="text-sm text-acero-600 dark:text-acero-400">
                    {parque.municipio}, {parque.estado}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCerrar}
                  aria-label="Cerrar ficha"
                  className="shrink-0 rounded-lg p-2 text-acero-600 hover:bg-acero-200/50 dark:text-acero-400 dark:hover:bg-acero-800"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {parque.foto_url && (
              <img
                src={parque.foto_url}
                alt={`Foto de ${parque.nombre}`}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
            )}

            <div className="space-y-5 px-5 pb-8 pt-4">
              <dl className="grid grid-cols-2 gap-3">
                <Dato titulo="Superficie" valor={formatearHectareas(parque.hectareas)} />
                <Dato titulo="Coordenadas" valor={`${parque.lat.toFixed(3)}, ${parque.lng.toFixed(3)}`} />
              </dl>

              {parque.descripcion && (
                <section>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-acero-400">
                    Descripción
                  </h3>
                  <p className="text-sm leading-relaxed text-acero-700 dark:text-acero-200">
                    {parque.descripcion}
                  </p>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-acero-400">
                  Servicios
                </h3>
                {parque.servicios.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {parque.servicios.map((s) => (
                      <li
                        key={s}
                        className="flex items-center gap-1.5 rounded-full bg-acero-200/60 px-2.5 py-1 text-xs font-semibold dark:bg-acero-800"
                      >
                        <span aria-hidden>{ICONO_SERVICIO[s]}</span>
                        {ETIQUETA_SERVICIO[s]}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-acero-400">Sin servicios registrados.</p>
                )}
              </section>

              {(parque.contacto_nombre || parque.contacto_telefono || parque.contacto_email || parque.sitio_web) && (
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-acero-400">
                    Contacto
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {parque.contacto_nombre && (
                      <li className="text-acero-700 dark:text-acero-200">{parque.contacto_nombre}</li>
                    )}
                    {parque.contacto_telefono && (
                      <li>
                        <a className="text-acero-700 underline underline-offset-2 hover:text-ambar dark:text-acero-200" href={`tel:${parque.contacto_telefono.replace(/\s/g, '')}`}>
                          {parque.contacto_telefono}
                        </a>
                      </li>
                    )}
                    {parque.contacto_email && (
                      <li>
                        <a className="text-acero-700 underline underline-offset-2 hover:text-ambar dark:text-acero-200" href={`mailto:${parque.contacto_email}`}>
                          {parque.contacto_email}
                        </a>
                      </li>
                    )}
                    {parque.sitio_web && (
                      <li>
                        <a className="text-acero-700 underline underline-offset-2 hover:text-ambar dark:text-acero-200" href={parque.sitio_web} target="_blank" rel="noreferrer noopener">
                          {parque.sitio_web.replace(/^https?:\/\//, '')}
                        </a>
                      </li>
                    )}
                  </ul>
                </section>
              )}

              <a
                href={urlComoLlegar(parque.lat, parque.lng)}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-ambar w-full"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Cómo llegar
              </a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-humo px-3 py-2 dark:bg-acero-950">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-acero-400">{titulo}</dt>
      <dd className="text-sm font-semibold text-acero-800 dark:text-white">{valor}</dd>
    </div>
  )
}
