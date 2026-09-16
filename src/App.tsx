import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Publico } from './paginas/Publico'
import { Admin } from './paginas/Admin'
import { supabaseConfigurado } from './lib/supabase'

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
      <Routes>
        <Route path="/" element={<Publico />} />
        <Route path="/parque/:id" element={<Publico />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  )
}
