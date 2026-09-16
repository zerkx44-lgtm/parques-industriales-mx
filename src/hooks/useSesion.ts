import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Devuelve la sesión actual y si el usuario está en la tabla `admins`.
 * Ojo: esto es solo para la interfaz. La seguridad real la impone RLS
 * en la base de datos, no este hook.
 */
export function useSesion() {
  const [sesion, setSesion] = useState<Session | null>(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true

    const revisarAdmin = async (s: Session | null) => {
      if (!s) {
        if (vivo) { setEsAdmin(false); setCargando(false) }
        return
      }
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', s.user.id)
        .maybeSingle()
      if (vivo) { setEsAdmin(Boolean(data)); setCargando(false) }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setSesion(data.session)
      void revisarAdmin(data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s)
      setCargando(true)
      void revisarAdmin(s)
    })

    return () => { vivo = false; sub.subscription.unsubscribe() }
  }, [])

  return { sesion, esAdmin, cargando }
}
