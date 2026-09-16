import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Publico } from './paginas/Publico'
import { Admin } from './paginas/Admin'
import { NuevaContrasena } from './paginas/NuevaContrasena'
import { supabase, supabaseConfigurado } from './lib/supabase'

/**
 * Los enlaces de recuperación que Supabase envía apuntan a la dirección
 * configurada como Site URL, que normalmente es la raíz del sitio y no la
 * pantalla de contraseña. Al canjear el token, supabase-js avisa con el
 * evento PASSWORD_RECOVERY; aquí lo escuchamos desde cualquier ruta y
 * llevamos al usuario a donde puede elegir su contraseña.
 */
function RedirigirRecuperacion() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') {
        navigate('/nueva-contrasena', { replace: true })
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  return null
}

export default function App() {
  if (!supabaseConfigurado) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="tarjeta max-w-md space-y-2 p-6 text-center">
          <p className="text-4xl" aria-hidden>🔌</p>
          <h1 className="text-xl font-extrabold">Falta configurar Supabase</h1>
          <p className="text-sm text-acero-600 dark:text-acero-400">
            Copia <code>.env.example</code> a <code>.env</code>, llena{' '}
            <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>, y reinicia{' '}
            <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <RedirigirRecuperacion />
      <Routes>
        <Route path="/" element={<Publico />} />
        <Route path="/parque/:id" element={<Publico />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  )
}
