import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Parque } from '../lib/tipos'

interface Opciones {
  /** true en el panel de administración: trae también los parques desactivados. */
  incluirInactivos?: boolean
}

export function useParques({ incluirInactivos = false }: Opciones = {}) {
  const [parques, setParques] = useState<Parque[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    let consulta = supabase.from('parques').select('*').order('nombre', { ascending: true })
    if (!incluirInactivos) consulta = consulta.eq('activo', true)

    const { data, error: err } = await consulta
    if (err) {
      setError(err.message)
      setParques([])
    } else {
      setParques((data ?? []) as Parque[])
    }
    setCargando(false)
  }, [incluirInactivos])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { parques, cargando, error, recargar: cargar }
}
