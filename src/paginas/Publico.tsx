import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Encabezado } from '../componentes/Encabezado'
import { PanelFiltros } from '../componentes/PanelFiltros'
import { TarjetaParque } from '../componentes/TarjetaParque'
import { FichaParque } from '../componentes/FichaParque'
import { Mapa } from '../componentes/Mapa'
import { EsqueletoLista } from '../componentes/Esqueletos'
import { useParques } from '../hooks/useParques'
import { useFiltros } from '../hooks/useFiltros'
import type { Parque } from '../lib/tipos'

/** Detecta si estamos en pantalla de celular (para la hoja deslizable). */
function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const alCambiar = () => setEsMovil(mq.matches)
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [])
  return esMovil
}

export function Publico() {
  const { parques, cargando, error, recargar } = useParques()
  const f = useFiltros(parques)
  const esMovil = useEsMovil()
  const navigate = useNavigate()
  const { id } = useParams()

  const [idResaltado, setIdResaltado] = useState<string | null>(null)
  // En celular la hoja arranca recogida para que el mapa se vea completo.
  const [listaAbierta, setListaAbierta] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 640,
  )

  const seleccionado = useMemo<Parque | null>(
    () => parques.find((p) => p.id === id) ?? null,
    [parques, id],
  )

  const abrir = useCallback(
    (p: Parque) => {
      navigate(`/parque/${p.id}${window.location.search}`)
      if (esMovil) setListaAbierta(false)
    },
    [navigate, esMovil],
  )

  const cerrar = useCallback(() => {
    navigate(`/${window.location.search}`)
  }, [navigate])

  // El parque pedido por URL puede no existir o estar inactivo.
  const idNoEncontrado = Boolean(id && !cargando && !seleccionado)

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Encabezado
        accion={
          <Link to="/admin" className="btn-fantasma text-xs">
            Administrar
          </Link>
        }
      />

      <main className="relative flex min-h-0 flex-1 sm:flex-row">
        {/* --------- Columna izquierda: filtros + lista (escritorio) --------- */}
        <section
          aria-label="Buscador y resultados"
          className="hidden w-[400px] shrink-0 flex-col border-r border-acero-200 dark:border-acero-800 sm:flex"
        >
          <PanelFiltros f={f} total={f.resultados.length} />
          <Resultados
            cargando={cargando}
            error={error}
            onReintentar={recargar}
            resultados={f.resultados}
            hayFiltros={f.hayFiltros}
            onLimpiar={f.limpiar}
            idResaltado={idResaltado}
            idSeleccionado={id ?? null}
            onSeleccionar={abrir}
            onResaltar={setIdResaltado}
          />
        </section>

        {/* --------- Mapa --------- */}
        <div className="relative min-h-0 flex-1">
          <Mapa
            parques={f.resultados}
            idResaltado={idResaltado}
            idSeleccionado={id ?? null}
            onSeleccionar={abrir}
            onResaltar={setIdResaltado}
          />
          {idNoEncontrado && (
            <div className="absolute inset-x-3 top-3 z-[500] rounded-lg bg-white p-3 text-sm shadow-lg dark:bg-acero-900">
              Ese parque no existe o fue desactivado.{' '}
              <button onClick={cerrar} className="font-bold text-ambar underline">Ver todos</button>
            </div>
          )}
        </div>

        {/* --------- Hoja deslizable con la lista (celular) --------- */}
        <motion.section
          aria-label="Buscador y resultados"
          className="absolute inset-x-0 bottom-0 z-[800] flex max-h-[88dvh] flex-col rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,.18)] dark:bg-acero-900 sm:hidden"
          initial={false}
          animate={{ y: listaAbierta ? '0%' : 'calc(100% - 92px)' }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 60) setListaAbierta(false)
            else if (info.offset.y < -60) setListaAbierta(true)
          }}
        >
          <button
            type="button"
            onClick={() => setListaAbierta((v) => !v)}
            aria-expanded={listaAbierta}
            className="w-full shrink-0 py-2"
          >
            <span className="mx-auto block h-1.5 w-12 rounded-full bg-acero-200 dark:bg-acero-700" />
            <span className="mt-1.5 block text-sm font-bold text-acero-600 dark:text-acero-400">
              {f.resultados.length} {f.resultados.length === 1 ? 'resultado' : 'resultados'}
              {listaAbierta ? ' · ocultar' : ' · ver lista'}
            </span>
          </button>
          <div className="flex min-h-0 flex-1 flex-col">
            <PanelFiltros f={f} total={f.resultados.length} />
            <Resultados
              cargando={cargando}
              error={error}
              onReintentar={recargar}
              resultados={f.resultados}
              hayFiltros={f.hayFiltros}
              onLimpiar={f.limpiar}
              idResaltado={idResaltado}
              idSeleccionado={id ?? null}
              onSeleccionar={abrir}
              onResaltar={setIdResaltado}
            />
          </div>
        </motion.section>
      </main>

      <FichaParque parque={seleccionado} onCerrar={cerrar} esMovil={esMovil} />
    </div>
  )
}

interface PropsResultados {
  cargando: boolean
  error: string | null
  onReintentar: () => void
  resultados: Parque[]
  hayFiltros: boolean
  onLimpiar: () => void
  idResaltado: string | null
  idSeleccionado: string | null
  onSeleccionar: (p: Parque) => void
  onResaltar: (id: string | null) => void
}

function Resultados({
  cargando, error, onReintentar, resultados, hayFiltros, onLimpiar,
  idResaltado, idSeleccionado, onSeleccionar, onResaltar,
}: PropsResultados) {
  if (cargando) return <div className="min-h-0 flex-1 overflow-y-auto"><EsqueletoLista /></div>

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-4xl" aria-hidden>⚠️</p>
        <p className="font-bold text-acero-800 dark:text-white">No pudimos cargar los parques</p>
        <p className="max-w-xs text-sm text-acero-600 dark:text-acero-400">{error}</p>
        <button onClick={onReintentar} className="btn-primario">Reintentar</button>
      </div>
    )
  }

  if (resultados.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-4xl" aria-hidden>🔎</p>
        <p className="font-bold text-acero-800 dark:text-white">Sin resultados</p>
        <p className="max-w-xs text-sm text-acero-600 dark:text-acero-400">
          Ningún parque coincide con los filtros seleccionados.
        </p>
        {hayFiltros && <button onClick={onLimpiar} className="btn-fantasma">Limpiar filtros</button>}
      </div>
    )
  }

  return (
    <ul className="scroll-fino min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
      <AnimatePresence mode="popLayout" initial={false}>
        {resultados.map((p) => (
          <TarjetaParque
            key={p.id}
            parque={p}
            resaltado={idResaltado === p.id}
            seleccionado={idSeleccionado === p.id}
            onSeleccionar={() => onSeleccionar(p)}
            onResaltar={onResaltar}
          />
        ))}
      </AnimatePresence>
    </ul>
  )
}
