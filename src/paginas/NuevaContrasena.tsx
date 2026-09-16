import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { Encabezado } from '../componentes/Encabezado'

/**
 * Pantalla a la que llega quien abre el enlace de recuperación del correo.
 *
 * El enlace trae un token que supabase-js canjea solo al cargar la página
 * (detectSessionInUrl viene activo por defecto), así que para cuando este
 * componente se monta ya suele haber sesión. Esa sesión sirve únicamente
 * para cambiar la contraseña.
 */
export function NuevaContrasena() {
  const navigate = useNavigate()
  const [revisandoSesion, setRevisandoSesion] = useState(true)
  const [haySesion, setHaySesion] = useState(false)
  const [contrasena, setContrasena] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vivo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setHaySesion(Boolean(data.session))
      setRevisandoSesion(false)
    })

    // El canje del token puede terminar un instante después del montaje.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      if (!vivo) return
      setHaySesion(Boolean(sesion))
      setRevisandoSesion(false)
    })

    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (contrasena !== repetida) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    const { error: err } = await supabase.auth.updateUser({ password: contrasena })

    if (err) {
      setError(
        err.message.includes('should be different')
          ? 'Esa ya es tu contraseña actual. Escribe una distinta.'
          : err.message,
      )
      setGuardando(false)
      return
    }

    toast.success('Contraseña actualizada. Ya puedes entrar.')
    navigate('/admin', { replace: true })
  }

  if (revisandoSesion) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-acero-400">
        Verificando el enlace…
      </div>
    )
  }

  // Enlace vencido, ya usado, o alguien que llegó aquí de forma directa.
  if (!haySesion) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Encabezado />
        <main className="grid flex-1 place-items-center p-4">
          <div className="tarjeta max-w-sm space-y-3 p-6 text-center">
            <p className="text-4xl" aria-hidden>⏳</p>
            <h1 className="text-xl font-extrabold text-acero-800 dark:text-white">
              El enlace ya no es válido
            </h1>
            <p className="text-sm text-acero-600 dark:text-acero-400">
              Los enlaces de recuperación caducan y solo se pueden usar una vez.
              Pide uno nuevo desde la pantalla de acceso.
            </p>
            <Link to="/admin" className="btn-primario">Ir al acceso</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado />
      <main className="grid flex-1 place-items-center p-4">
        <motion.form
          onSubmit={guardar}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="tarjeta w-full max-w-sm space-y-4 p-6 shadow-lg"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-acero-800 dark:text-white">
              Elige tu contraseña
            </h1>
            <p className="mt-1 text-sm text-acero-600 dark:text-acero-400">
              Escríbela dos veces para confirmar que quedó como quieres.
            </p>
          </div>

          <div>
            <label htmlFor="nueva" className="mb-1 block text-xs font-bold uppercase tracking-wider text-acero-400">
              Nueva contraseña
            </label>
            <input
              id="nueva" type="password" required autoComplete="new-password" className="campo"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)}
            />
            <p className="mt-1 text-xs text-acero-400">Mínimo 8 caracteres.</p>
          </div>

          <div>
            <label htmlFor="repetir" className="mb-1 block text-xs font-bold uppercase tracking-wider text-acero-400">
              Repetir contraseña
            </label>
            <input
              id="repetir" type="password" required autoComplete="new-password" className="campo"
              value={repetida} onChange={(e) => setRepetida(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={guardando} className="btn-primario w-full">
            {guardando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </motion.form>
      </main>
    </div>
  )
}
