import { motion } from 'framer-motion'
import { Chip } from './Chip'
import { Contador } from './Contador'
import { COLOR_SECTOR, ETIQUETA_SECTOR, ETIQUETA_SERVICIO, ICONO_SERVICIO } from '../lib/tipos'
import type { useFiltros } from '../hooks/useFiltros'

type Filtros = ReturnType<typeof useFiltros>

export function PanelFiltros({ f, total }: { f: Filtros; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-3 border-b border-acero-200 bg-white/70 p-3 dark:border-acero-800 dark:bg-acero-900/50"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-acero-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <label htmlFor="buscador" className="sr-only">
            Buscar por nombre, municipio o estado
          </label>
          <input
            id="buscador"
            type="search"
            value={f.textoLocal}
            onChange={(e) => f.setTextoLocal(e.target.value)}
            placeholder="Buscar parque, municipio o estado…"
            className="campo pl-9"
          />
        </div>
        <div>
          <label htmlFor="estado" className="sr-only">Estado</label>
          <select
            id="estado"
            value={f.estado}
            onChange={(e) => f.actualizar('estado', e.target.value)}
            className="campo w-36 sm:w-44"
          >
            <option value="">Todos los estados</option>
            {f.estados.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-acero-400">Sector</p>
        <div className="flex flex-wrap gap-1.5">
          {f.todosSectores.map((s) => (
            <Chip key={s} activo={f.sectores.includes(s)} color={COLOR_SECTOR[s]} onClick={() => f.alternarSector(s)}>
              {ETIQUETA_SECTOR[s]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-acero-400">
          Servicios <span className="font-medium normal-case tracking-normal">(debe tenerlos todos)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {f.todosServicios.map((s) => (
            <Chip key={s} activo={f.servicios.includes(s)} onClick={() => f.alternarServicio(s)} titulo={ETIQUETA_SERVICIO[s]}>
              <span aria-hidden>{ICONO_SERVICIO[s]}</span>
              {ETIQUETA_SERVICIO[s]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <p className="text-sm font-semibold text-acero-600 dark:text-acero-400">
          <Contador valor={total} />{' '}
          {total === 1 ? 'parque encontrado' : 'parques encontrados'}
        </p>
        {f.hayFiltros && (
          <button
            type="button"
            onClick={f.limpiar}
            className="text-xs font-bold uppercase tracking-wider text-ambar hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </motion.div>
  )
}
