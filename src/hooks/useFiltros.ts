import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SECTORES, SERVICIOS, type Parque, type Sector, type Servicio } from '../lib/tipos'
import { normalizar } from '../lib/utiles'

/**
 * Los filtros viven en la URL (?q=...&estado=...&sector=a,b&servicios=x,y)
 * para que cualquier búsqueda se pueda copiar y compartir.
 */
export function useFiltros(parques: Parque[]) {
  const [params, setParams] = useSearchParams()

  const q = params.get('q') ?? ''
  const estado = params.get('estado') ?? ''
  const sectores = useMemo(
    () => (params.get('sector')?.split(',').filter(Boolean) ?? []) as Sector[],
    [params],
  )
  const servicios = useMemo(
    () => (params.get('servicios')?.split(',').filter(Boolean) ?? []) as Servicio[],
    [params],
  )

  // Debounce del texto: escribimos en un estado local inmediato y
  // 250 ms después lo pasamos a la URL, para no re-filtrar en cada tecla.
  const [textoLocal, setTextoLocal] = useState(q)
  useEffect(() => setTextoLocal(q), [q])

  useEffect(() => {
    if (textoLocal === q) return
    const t = setTimeout(() => {
      setParams(
        (prev) => {
          const nuevos = new URLSearchParams(prev)
          if (textoLocal) nuevos.set('q', textoLocal)
          else nuevos.delete('q')
          return nuevos
        },
        { replace: true },
      )
    }, 250)
    return () => clearTimeout(t)
  }, [textoLocal, q, setParams])

  const actualizar = useCallback(
    (clave: string, valor: string) => {
      setParams(
        (prev) => {
          const nuevos = new URLSearchParams(prev)
          if (valor) nuevos.set(clave, valor)
          else nuevos.delete(clave)
          return nuevos
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const alternarSector = useCallback(
    (s: Sector) => {
      const siguiente = sectores.includes(s) ? sectores.filter((x) => x !== s) : [...sectores, s]
      actualizar('sector', siguiente.join(','))
    },
    [sectores, actualizar],
  )

  const alternarServicio = useCallback(
    (s: Servicio) => {
      const siguiente = servicios.includes(s)
        ? servicios.filter((x) => x !== s)
        : [...servicios, s]
      actualizar('servicios', siguiente.join(','))
    },
    [servicios, actualizar],
  )

  const limpiar = useCallback(() => {
    setTextoLocal('')
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  const hayFiltros = Boolean(q || estado || sectores.length || servicios.length)

  const estados = useMemo(
    () => [...new Set(parques.map((p) => p.estado))].sort((a, b) => a.localeCompare(b, 'es')),
    [parques],
  )

  const resultados = useMemo(() => {
    const busqueda = normalizar(q)
    return parques.filter((p) => {
      if (busqueda) {
        const heno = normalizar(`${p.nombre} ${p.municipio} ${p.estado}`)
        if (!heno.includes(busqueda)) return false
      }
      if (estado && p.estado !== estado) return false
      if (sectores.length && !sectores.includes(p.sector)) return false
      // El parque debe tener TODOS los servicios seleccionados.
      if (servicios.length && !servicios.every((s) => p.servicios.includes(s))) return false
      return true
    })
  }, [parques, q, estado, sectores, servicios])

  return {
    textoLocal,
    setTextoLocal,
    estado,
    sectores,
    servicios,
    estados,
    resultados,
    hayFiltros,
    actualizar,
    alternarSector,
    alternarServicio,
    limpiar,
    todosSectores: SECTORES,
    todosServicios: SERVICIOS,
  }
}
