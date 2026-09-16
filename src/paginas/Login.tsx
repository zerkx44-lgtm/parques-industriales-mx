import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Encabezado } from '../componentes/Encabezado'

export function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    })
    if (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : err.message,
      )
      setEnviando(false)
    }
    // Si sale bien, useSesion detecta el cambio y muestra el panel.
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado accion={<Link to="/" className="btn-fantasma text-xs">Ver mapa</Link>} />
      <main className="grid flex-1 place-items-center p-4">
        <motion.form
          onSubmit={entrar}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="tarjeta w-full max-w-sm space-y-4 p-6 shadow-lg"
        >
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-acero-800 dark:text-white">
              Acceso administrativo
            </h1>
            <p className="mt-1 text-sm text-acero-600 dark:text-acero-400">
              Entra con tu correo y contraseña para gestionar el directorio.
            </p>
          </div>

          <div>
            <label htmlFor="correo" className="mb-1 block text-xs font-bold uppercase tracking-wider text-acero-400">
              Correo
            </label>
            <input
              id="correo" type="email" required autoComplete="email" className="campo"
              value={correo} onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@empresa.mx"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1 block text-xs font-bold uppercase tracking-wider text-acero-400">
              Contraseña
            </label>
            <input
              id="contrasena" type="password" required autoComplete="current-password" className="campo"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primario w-full">
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </motion.form>
      </main>
    </div>
  )
}
